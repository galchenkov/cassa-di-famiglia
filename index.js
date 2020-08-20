const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

const { response, appAction, screen, text, button, image, listItem, imageIcon } = require('./chatium/json')
const { navigate, apiCall, showToast, copyToClipboard, refresh } = require('./chatium/actions')

const categories = require('./data/tanununuki/categories')
const products = require('./data/tanununuki/products')
const { sign } = require("jsonwebtoken")

const orders = {
    // Структура:
    // authId: {
    //   productId: count
    // }
}

const app = express()
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.json(
        response(
            screen('Ресторан Cassa di Famiglia', [
                text('Рекламная акция индуктивно порождает фирменный стиль, используя опыт предыдущих кампаний. Представляется логичным, что анализ рыночных цен многопланово отталкивает сублимированный баинг и селлинг. Лидерство в продажах, безусловно, синхронизирует презентационный материал.'),
                image('https://fs.chatium.io/fileservice/file/download/h/image_QKwNFH2SsM.1000x715.png'),
                text('Целевая аудитория, в рамках сегодняшних воззрений, исключительно искажает коллективный имидж. Ребрендинг отталкивает комплексный целевой трафик, учитывая результат предыдущих медиа-кампаний. Еще Траут показал, что воздействие на потребителя стабилизирует мониторинг активности, размещаясь во всех медиа. А вот по мнению аналитиков медиаплан развивает рекламный бриф. Product placement абстрактен. Поисковая реклама актаульна как никогда.'),
                button('Меню ресторана', navigate('/menu')),
                button('Мой заказ', navigate(`/order`)),
                button('Контакты', navigate('/contacts')),
                button('Данные из Чатиума', navigate('/chatium')),
            ]),
        ),
    )
})

app.get('/contacts', (req, res) => {
    res.json(
        response(
            screen('Контакты', [
                text('Семья ее жила в "старом городе" Villarosa. Я развернул карту Сицилии, отыскал адрес и обвел ее дом тонким красным фломастером. То был действительно очень старый семейный ресторан.'),
                image('https://fs.chatium.io/fileservice/file/download/h/image_VkmpttT2ls.800x800.png'),
                button('ул. Металлургов, 7/18', copyToClipboard('ул. Металлургов, 7/18'), {buttonType: 'flat'}),
                button('+7 495 306-24-57', copyToClipboard('+7 495 306-24-57'), {buttonType: 'flat'}),
                button('Главная страница', navigate('/')),
            ]),
        ),
    )
})

app.get('/chatium', (req, res) => {
    try {
        const payload = jwt.verify(req.header('x-chatium-application'), process.env.API_SECRET)

        const accountId = payload.accountId || '–'
        const authId =  payload.authId || '–'
        const userId =  payload.userId || '–'
        const authToken =  payload.authToken || '–'

        const method = 'get'
        const url = '/api/v1/heap/hellomoto'

        console.log(sign(
            { authToken },
            process.env.API_SECRET + method + url
        ))

        return res.json(
            response(
                screen('Данные из чатиума', [
                    text('Account'),
                    button(accountId, copyToClipboard(accountId), {buttonType: 'flat'}),
                    text('Auth'),
                    button(authId, copyToClipboard(authId), {buttonType: 'flat'}),
                    text('User'),
                    button(userId, copyToClipboard(userId), {buttonType: 'flat'}),
                    button('Главная страница', navigate('/')),
                ]),
            ),
        )
    } catch (e) {
        return res.json(
            response(
                screen('Данные из чатиума', [
                    text('Ошибка сигнатуры'),
                    button('Главная страница', navigate('/')),
                ]),
            ),
        )
    }
})

app.get('/menu', (req, res) => {
    res.json(
        response(
            screen('Меню', [
                ...categories
                    .flatMap(category => ([
                        listItem(
                            category.name,
                            category.description,
                            imageIcon(category.image),
                            {
                                onClick: navigate(`/menu/${category.id}`)
                            }
                        ),
                    ])),
                button('Главная страница', navigate(`/`))
            ])
        )
    )
})

app.get('/menu/:category', (req, res) => {
    const category = categories.find(category => category.id === req.params.category)

    const zeroPaddingContainerStyle = {
        containerStyle: {
            paddingLeft: 0,
            paddingRight: 0,
        }
    }

    const productBlock = (product) => ({
        type: 'text',
        containerStyle: {
            flexBasis: '50%',
            flexShrink: 0,
            paddingLeft: 0,
            paddingRight: 0,
        },
        blocks: [
            image(fs(product.image, '150x150'), zeroPaddingContainerStyle),
            text(product.name, { fontSize: 'medium', isBold: true, containerStyle: { zeroPaddingContainerStyle, marginTop: 0, marginBottom: 5 } }),
            text(product.description, { fontSize: 'medium', color: '#777777', containerStyle: { zeroPaddingContainerStyle, marginTop: 0, marginBottom: 10 } }),
            text(product.price + '₽', { fontSize: 'xxlarge', containerStyle: { zeroPaddingContainerStyle, marginTop: 0, marginBottom: 0 } }),
        ],
        onClick: navigate(`/menu/${category.id}/${product.id}`),
    })

    res.json(
        response(
            screen(category.name, [
                ...products
                    .filter(product => product.category === category.id)
                    .reduce(function (result, array, index) {
                        index % 2 ? result[result.length - 1].push(array) : result.push([array])

                        return result
                    }, [])
                    .flatMap(tuple => ([
                        {
                            type: 'text',
                            containerStyle: {
                                flexDirection: 'row',
                            },
                            blocks: [
                                tuple[0] && productBlock(tuple[0]),
                                tuple[1] && productBlock(tuple[1]),
                            ].filter(Boolean),
                        },
                    ])),
                button('Меню', navigate(`/menu`)),
            ])
        )
    )
})

app.get('/menu/:category/:product', (req, res) => {
    const authId = jwt.verify(req.header('x-chatium-application'), process.env.API_SECRET).authId

    const category = categories.find(category => category.id === req.params.category)
    const product = products.find(product => product.id === req.params.product)

    const count = orders[authId]
        ? orders[authId][product.id]
            ? orders[authId][product.id]
            : 0
        : 0

    const zeroMarginContainerStyle = { containerStyle: { marginTop: 0, marginBottom: 0 } }
    const orderButton = count === 0
        ? button('Добавить в заказ', apiCall(`/order/add`, { product: product.id }))
        : {
            type: 'text',
            containerStyle: {
                flexDirection: 'row',
                paddingLeft: 0,
                paddingRight: 0,
                marginTop: 0,
                marginBottom: 20,
                paddingTop: 0,
                paddingBottom: 0,
            },
            blocks: [
                button('−', apiCall(`/order/remove`, { product: product.id }), zeroMarginContainerStyle),
                button(`${count} шт`, navigate(`/order`), zeroMarginContainerStyle),
                button('+', apiCall(`/order/add`, { product: product.id }), zeroMarginContainerStyle),
            ],
        }

    res.json(
        response(
            screen(product.name, [
                image(fs(product.image, '900x900')),
                text(product.name, {
                    fontSize: 'xxlarge',
                    isBold: true,
                }),
                text(product.description),
                text(product.price + ' руб.', {
                    fontSize: 'xxxlarge',
                    isBold: true,
                }),
                authId && orderButton,
                button(`Назад в ${category.name}`, navigate(`/menu/${category.id}`))
            ])
        )
    )
})

app.get('/order', (req, res) => {
    const authId = jwt.verify(req.header('x-chatium-application'), process.env.API_SECRET).authId

    if (orders[authId] && Object.keys(orders[authId]).length > 0) {
        const productIds = Object.keys(orders[authId])

        const total = productIds.reduce((result, id) => {
            const product = products.find(product => product.id === id)

            return result + product.price * orders[authId][id]
        }, 0)

        return res.json(
            response(
                screen('Заказ', [
                    ...productIds.map(id => {
                        const product = products.find(product => product.id === id)
                        const category = categories.find(category => category.id === product.category)

                        return listItem(
                            orders[authId][id] + ' x ' + product.name,
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
                        fontSize: 'xxxlarge',
                    }),
                    button('Оплатить заказ', showToast('Я пока не умею =('))
                ])
            )
        )
    }

    res.json(
        response(
            screen('Заказ', [
                text('Ваш заказ пустой =(', {
                    containerStyle: {
                        marginTop: 50,
                        marginBottom: 50,
                    },
                }),
                button('Меню', navigate(`/menu`)),
            ])
        )
    )
})

app.post('/order/add', (req, res) => {
    const authId = jwt.verify(req.header('x-chatium-application'), process.env.API_SECRET).authId

    if (!orders[authId]) {
        orders[authId] = {}
    }

    if (!orders[authId][req.body.product]) {
        orders[authId][req.body.product] = 0
    }

    orders[authId][req.body.product]++

    res.json(
        appAction(
            refresh()
        )
    )
})

app.post('/order/remove', (req, res) => {
    const authId = jwt.verify(req.header('x-chatium-application'), process.env.API_SECRET).authId

    if (orders[authId] && orders[authId][req.body.product]) {
        orders[authId][req.body.product]--

        if (orders[authId][req.body.product] === 0) {
            delete orders[authId][req.body.product]
        }
    }

    res.json(
        appAction(
            refresh()
        )
    )
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
