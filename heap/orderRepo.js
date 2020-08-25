const {HeapRepo} = require('@chatium/sdk')

const orderRepo = new HeapRepo('Order', {
  authId: {
    type: 'int',
  },
  number: {
    type: 'string',
  },
  status: {
    type: 'string',
  },
  products: {
    type: 'object',
    default: {},
  },
})

const NEW = 'new'
const PROCESSING = 'processing'
const COMPLETE = 'complete'

const orderStatus = {
  NEW,
  PROCESSING,
  COMPLETE,
}

async function getOrderByAuthId(ctx, authId) {
  const allOrders = await orderRepo.findAll(ctx)
  return allOrders.find(o => o.authId === authId && o.status === NEW)
}

async function getOrCreateOrderByAuthId(ctx, authId) {
  let order = await getOrderByAuthId(ctx, authId)
  if (!order) {
    order = await orderRepo.create(ctx, {
      authId,
      number: Math.round(Math.random() * 100).toString(),
      status: NEW,
    })
  }
  return order
}

async function startProcessingOrder(ctx, order) {
  return await orderRepo.update(ctx, {
    id: order.id,
    status: PROCESSING,
  })
}

module.exports = {
  orderRepo,
  getOrderByAuthId,
  getOrCreateOrderByAuthId,
  startProcessingOrder,
  orderStatus,
}
