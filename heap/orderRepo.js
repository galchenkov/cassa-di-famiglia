const {HeapRepo} = require('@chatium/sdk')

const orderRepo = new HeapRepo('Order', {
  authId: {
    type: 'int',
  },
  products: {
    type: 'object',
    default: {},
  },
})


async function getOrderByAuthId(ctx, authId) {
  const allOrders = await orderRepo.findAll(ctx)
  return allOrders.find(o => o.authId === authId)
}

async function getOrCreateOrderByAuthId(ctx, authId) {
  let order = await getOrderByAuthId(ctx, authId)
  if (!order) {
    order = await orderRepo.create(ctx, {authId})
  }
  return order
}

module.exports = {
  orderRepo,
  getOrderByAuthId,
  getOrCreateOrderByAuthId,
}
