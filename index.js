const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const { response, appAction, screen, text, button, image, listItem, imageIcon } = require('./chatium/json')
const { screenResponse, apiCallResponse, navigate, apiCall, copyToClipboard, refresh, Screen, Text, Button, Image, ListItem } = require('@chatium/json')

const categories = require('./data/tanununuki/categories')
const products = require('./data/tanununuki/products')

const { chatiumPost } = require('@chatium/sdk')
const { orderRepo, getOrderByAuthId, getOrCreateOrderByAuthId, startProcessingOrder } = require('./heap/orderRepo')

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', async (req, res) => res.json(
    screenResponse({ data: await Screen({ title: 'Ресторан Cassa di Famiglia' }, [
        Text({ text: 'Рекламная акция индуктивно порождает фирменный стиль, используя опыт предыдущих кампаний. Представляется логичным, что анализ рыночных цен многопланово отталкивает сублимированный баинг и селлинг. Лидерство в продажах, безусловно, синхронизирует презентационный материал.' }),
        Image({ downloadUrl: 'https://fs.chatium.io/fileservice/file/download/h/image_QKwNFH2SsM.1000x715.png' }),
        Button({ title: 'Меню ресторана', onClick: navigate('/menu') }),
        Button({ title: 'Мой заказ', onClick: navigate('/order') }),
        Button({ title: 'Контакты', onClick: navigate('/contacts') }),
        Button({ title: 'Данные из Чатиума', onClick: navigate('/chatium') }),
    ])})
))

app.get('/contacts', async (req, res) => res.json(
    screenResponse({ data: await Screen({ title: 'Контакты' }, [
        Text({ text: 'Семья ее жила в "старом городе" Villarosa. Я развернул карту Сицилии, отыскал адрес и обвел ее дом тонким красным фломастером. То был действительно очень старый семейный ресторан.' }),
        Image({ downloadUrl: 'https://fs.chatium.io/fileservice/file/download/h/image_VkmpttT2ls.800x800.png' }),
        Button({ title: 'ул. Металлургов, 7/18', onClick: copyToClipboard('ул. Металлургов, 7/18'), buttonType: 'flat' }),
        Button({ title: '+7 495 306-24-57', onClick: copyToClipboard('+7 495 306-24-57'), buttonType: 'flat' }),
        Button({ title: 'Главная страница', onClick: navigate('/') }),
    ])})
))

app.get('/chatium', async (req, res) => {
    try {
        const ctx = getContext(req)
        return res.json(
            screenResponse({ data: await Screen({ title: 'Данные из чатиума' }, [
                Text({ text: 'Account Id' }),
                Button({ title: ctx.account.id, onClick: copyToClipboard(ctx.account.id), buttonType: 'flat' }),
                Text({ text: 'Account Host' }),
                Button({ title: ctx.account.host, onClick: copyToClipboard(ctx.account.host), buttonType: 'flat' }),
                Text({ text: 'Auth' }),
                Button({ title: ctx.auth.id, onClick: copyToClipboard(ctx.auth.id), buttonType: 'flat' }),
                Button({ title: 'Главная страница', onClick: navigate('/') }),
            ])})
        )
    } catch (e) {
        return res.json(
            screenResponse({ data: await Screen({ title: 'Данные из чатиума' }, [
                    Text({ text: 'Ошибка сигнатуры' }),
                    Button({ title: 'Главная страница', onClick: navigate('/') }),
                ])})
        )
    }
})

app.get('/menu', async (req, res) => res.json(
    screenResponse({ data: await Screen({ title: 'Меню' }, [
        ...categories.flatMap(category => ([
            ListItem({
                title: category.name,
                description: category.description,
                logo: {
                    shape: 'circle',
                    image: category.image,
                },
                onClick: navigate(`/menu/${category.id}`),
            })
        ])),
        Button({ title: 'Главная страница', onClick: navigate(`/`) }),
    ])})
))

app.get('/menu/:category', async (req, res) => {
    const category = categories.find(category => category.id === req.params.category)

    const byCategory = product => product.category === category.id
    const toTuples = function (result, array, index) {
        index % 2 ? result[result.length - 1].push(array) : result.push([array])

        return result
    }

    const ProductRowBlock = async tuple => Text({
        containerStyle: {
            flexDirection: 'row',
        },
    }, tuple.map(ProductCardBlock))

    const ProductCardBlock = async product => Text({
        containerStyle: {
            flexBasis: '50%',
            flexShrink: 0,
            paddingLeft: 0,
            paddingRight: 0,
        },
        onClick: navigate(`/menu/${category.id}/${product.id}`),
    }, [
        Image({
            downloadUrl: fs(product.image, '150x150'),
            containerStyle: {
                paddingLeft: 0,
                paddingRight: 0,
            },
        }),
        Text({
            text: product.name,
            fontSize: 'medium',
            isBold: true,
            containerStyle: {
                marginTop: 0,
                marginBottom: 5
            },
        }),
        Text({
            text: product.description,
            fontSize: 'medium',
            color: '#777777',
            containerStyle: {
                marginTop: 0,
                marginBottom: 10,
            },
        }),
        Text({
            text: product.price + '₽',
            fontSize: 'xxlarge',
            color: '#777777',
            containerStyle: {
                marginTop: 0,
                marginBottom: 0,
            },
        }),
    ])

    res.json(
        screenResponse({ data: await Screen({ title: category.name }, [
            ...products.filter(byCategory).reduce(toTuples, []).map(ProductRowBlock),
            Button({ title: 'Главная страница', onClick: navigate(`/`) }),
        ])})
    )
})

app.get('/menu/:category/:product', async (req, res) => {
    const ctx = getContext(req)
    const order = await getOrderByAuthId(ctx, ctx.auth.id)

    const category = categories.find(category => category.id === req.params.category)
    const product = products.find(product => product.id === req.params.product)

    const count = order
        ? order.products[product.id]
            ? order.products[product.id]
            : 0
        : 0

    const zeroMarginContainerStyle = { containerStyle: { marginTop: 0, marginBottom: 0 } }
    const orderButton = count === 0
        ? Button({ title: 'Добавить в заказ', onClick: apiCall(`/order/add`, { product: product.id }) })
        : Text({ containerStyle: { flexDirection: 'row', paddingLeft: 0, paddingRight: 0, } }, [
            Button({
                title: '−',
                onClick: apiCall(`/order/remove`, { product: product.id }),
                ...zeroMarginContainerStyle
            }),
            Button({ title: `${count} шт`, onClick: navigate(`/order`), ...zeroMarginContainerStyle }),
            Button({ title: '+', onClick: apiCall(`/order/add`, { product: product.id }), ...zeroMarginContainerStyle }),
        ])

    res.json(
        screenResponse({ data: await Screen({ title: product.name }, [
            Image({ downloadUrl: fs(product.image, '900x900') }),
            Text({ text: product.name, fontSize: 'xxlarge', isBold: true }),
            Text({ text: product.description }),
            Text({ text: product.price + ' руб.', fontSize: 'xxxlarge', isBold: true }),
            ctx.auth.id && orderButton,
            Button({ title: `Назад в ${category.name}`, onClick: navigate(`/menu/${category.id}`) })
        ])})
    )
})

app.get('/order', async (req, res) => {
    const ctx = getContext(req)
    const order = await getOrderByAuthId(ctx, ctx.auth.id)

    if (order && Object.keys(order.products).length > 0) {
        const productIds = Object.keys(order.products)

        const total = productIds.reduce((result, id) => {
            const product = products.find(product => product.id === id)

            return result + product.price * order.products[id]
        }, 0)

        return res.json(
            screenResponse({ data: await Screen({ title: 'Заказ' }, [
                ...productIds.map(id => {
                    const product = products.find(product => product.id === id)
                    const category = categories.find(category => category.id === product.category)

                    return ListItem({
                        title: order.products[id] + ' x ' + product.name,
                        description: product.description,
                        logo: {
                            shape: 'square',
                            image: fs(product.image, '200x200'),
                        },
                        status: {
                            text: product.price + '₽',
                            bgColor: 'blue',
                            color: 'white',
                            isAvailable: true,
                        },
                        onClick: navigate(`/menu/${category.id}/${product.id}`),
                    })
                }),
                Text({ text: `Итого: ${total} руб.`, fontSize: 'xxxlarge' }),
                Button({ title: 'Оплатить заказ', onClick: apiCall('/order') }),
            ])})
        )
    }

    res.json(
        screenResponse({ data: await Screen({ title: 'Заказ' }, [
            Text({ text: 'Ваш заказ пустой =(', containerStyle: { marginTop: 50, marginBottom: 50 } }),
            Button({ title: 'Меню', onClick: navigate(`/menu`) }),
        ])})
    )
})

app.post('/order/add', async (req, res) => {
    const ctx = getContext(req)
    const order = await getOrCreateOrderByAuthId(ctx, ctx.auth.id)

    await orderRepo.update(ctx, {
      id: order.id,
      products: {
        ...order.products,
        [req.body.product]: order.products[req.body.product] ? order.products[req.body.product] + 1 : 1,
      }
    })

    res.json(
        apiCallResponse({ appAction: refresh() })
    )
})

app.post('/order/remove', async (req, res) => {
    const ctx = getContext(req)
    const order = await getOrCreateOrderByAuthId(ctx, ctx.auth.id)

    const productId = req.body.product
    const products = order.products
    if (products[productId] != null) {
      if (products[productId] > 1) {
        products[productId]--
      } else {
        delete products[productId]
      }

      await orderRepo.update(ctx, {
        id: order.id,
        products,
      })
    }

    res.json(
        apiCallResponse({ appAction: refresh() })
    )
})

app.post('/order', async (req, res) => {
    const ctx = getContext(req)
    const order = await getOrCreateOrderByAuthId(ctx, ctx.auth.id)

    const productIds = Object.keys(order.products)

    const amount = productIds.reduce((result, id) => {
        const product = products.find(product => product.id === id)

        return result + product.price * order.products[id]
    }, 0)

    const feedResponse = await chatiumPost(ctx, `/api/v1/feed/personal/${order.id}`, {
        title: 'Costa Coffee',
        icon: imageIcon(fs('image_Q3xnPWCppc.1000x1000.png', '100x100')),
    })

    await chatiumPost(ctx, `/api/v1/feed/${feedResponse.feed_uid}/message`, {
        text:`Поступил новый заказ #${order.number}`,
        blocks: messageOrderBlocks(ctx, order),
    })

    await startProcessingOrder(ctx, order)

    const response = await chatiumPost(ctx, `/api/v1/payment/${order.id}`, {
        description: `Оплата заказа #${order.number}`,
        amount: true ? 1 : amount,
        callback: `https://${ctx.account.host}/-/restoranium/hook/payment/${order.id}`,
        successUrl: `https://${ctx.account.host}/feed/${feedResponse.feed_uid}`,
    })

    return res.json(
        apiCallResponse({ appAction: response.action })
    )
})

app.post('/hook/payment/:orderId', async (req, res) => {
    const ctx = getContext(req)

    const feedResponse = await chatiumPost(ctx, `/api/v1/feed/personal/${req.params.orderId}`, {
        title: 'Costa Coffee',
        icon: imageIcon(fs('image_Q3xnPWCppc.1000x1000.png', '100x100')),
    })

    await chatiumPost(ctx, `/api/v1/feed/${feedResponse.feed_uid}/message`, {
        text:`Поступила оплата по заказу`,
    })

    return res.json({ success: true })
})

const listen = (app, port) => app.listen(port, '0.0.0.0', () => {
    console.log(`Listening at http://localhost:${port}`)
})

if (process.env.NODE_ENV === 'development') {
    const fs = require('fs')

    fs.readFile('vendor/index.html', 'utf8', function(err, data) {
        const index = data.replace('~~API_SECRET~~', process.env.API_SECRET)

        const vendor = express()
        vendor.use(cors())

        vendor.get('/', (req, res) => res.send(index))
        vendor.use(express.static('vendor'))
        vendor.get('*', (req, res) => res.send(index))

        listen(vendor, 5000)
    })
}

listen(app, process.env.PORT || 5050)

const fs = (hash, size = '100x100') => `https://fs.chatium.io/fileservice/file/thumbnail/h/${hash}/s/${size}`

function getContext(req) {
  const token = jwt.verify(req.header('x-chatium-application'), process.env.API_SECRET)

  return {
    auth: {
      id: token.authId,
      type: 'Phone',
      key: '',
      requestToken: token.authToken,
    },
    account: {
      id: token.accountId,
      host: token.accountHost,
    },
    app: {
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET,
    }
  }
}

function messageOrderBlocks(ctx, order) {
    const productIds = Object.keys(order.products)

    const total = productIds.reduce((result, id) => {
        const product = products.find(product => product.id === id)

        return result + product.price * order.products[id]
    }, 0)

    return [
        ...productIds.map(id => {
            const product = products.find(product => product.id === id)
            const category = categories.find(category => category.id === product.category)

            return listItem(
                order.products[id] + ' x ' + product.name,
                product.description,
                imageIcon(fs(product.image, '200x200')),
                {
                    onClick: navigate(`/menu/${category.id}/${product.id}`),
                    status: {
                        text: product.price + '₽',
                        bgColor: 'blue',
                        color: 'white',
                        isAvailable: true,
                    },
                }
            )
        }),
        text(`Итого: ${total} руб.`, {
            fontSize: 'large',
            containerStyle: {
                borderTopWidth: 1,
                borderTopColor: 'black',
            }
        }),
    ]
}
