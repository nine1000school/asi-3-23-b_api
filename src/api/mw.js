import config from "@/api/config.js"
import BaseModel from "@/api/db/models/BaseModel.js"
import deepmerge from "deepmerge"
import knex from "knex"
import winston from "winston"

const mw = (methodHandlers) => async (req, res) => {
  const methodHandler = methodHandlers[req.method]

  if (!methodHandler) {
    res.status(405).send({ error: "method not allowed" })

    return
  }

  const handlers = Array.isArray(methodHandler)
    ? methodHandler
    : [methodHandler]
  let handlerIndex = 0
  const logger = winston.createLogger({
    transports: [
      new winston.transports.Console({ eol: "\n--------------------------\n" }),
    ],
  })
  const db = knex(config.db)
  const locals = {}
  const ctx = {
    db,
    logger,
    req,
    res,
    get locals() {
      return locals
    },
    set locals(newLocals) {
      Object.assign(locals, deepmerge(locals, newLocals))
    },
    next: async () => {
      const handler = handlers[handlerIndex]
      handlerIndex += 1

      await handler(ctx)
    },
  }

  BaseModel.knex(db)
  await ctx.next()
}

export default mw