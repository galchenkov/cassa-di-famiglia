const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const { response, appAction, screen, text, button, image, listItem, imageIcon } = require('./chatium/json')
const { navigate, apiCall, showToast, copyToClipboard, refresh } = require('./chatium/actions')

const categories = require('./data/categories')
const products = require('./data/products')
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
    const accountId = req.header('x-chatium-account-id') || '–'
    const authId = req.header('x-chatium-auth-id') || '–'
    const userId = req.header('x-chatium-user-id') || '–'

    res.json(
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

    res.json(
        response(
            screen(category.name, [
                ...products
                    .filter(product => product.category === category.id)
                    .flatMap(product => ([
                        listItem(
                            product.name,
                            product.description,
                            imageIcon(product.image),
                            {
                                onClick: navigate(`/menu/${category.id}/${product.id}`),
                                status: {
                                    text: product.price + '₽',
                                    bgColor: 'blue',
                                    color: 'white',
                                    isAvailable: true,
                                },
                            }
                        ),
                    ])),
                button('Меню', navigate(`/menu`))
            ])
        )
    )
})

app.get('/menu/:category/:product', (req, res) => {
    const authId = req.header('x-chatium-auth-id') || null

    const category = categories.find(category => category.id === req.params.category)
    const product = products.find(product => product.id === req.params.product)

    const count = orders[authId]
        ? orders[authId][product.id]
            ? orders[authId][product.id]
            : 0
        : 0
    const order = orders[authId] && Object.keys(orders[authId]).length > 0

    res.json(
        response(
            screen(product.name, [
                image(product.image),
                text(product.name, {
                    fontSize: 'xxlarge',
                    isBold: true,
                }),
                text(product.description),
                text(product.price + ' руб.', {
                    fontSize: 'xxxlarge',
                    isBold: true,
                }),
                authId && button(
                    count === 0
                        ? 'Добавить в заказ'
                        : `В заказе ${count} шт`
                    , apiCall(`/order/add`, {
                        product: product.id,
                    })
                ),
                count > 0 && button('Убать из заказа', apiCall(`/order/remove`, {
                    product: product.id,
                })),
                order && button('Мой заказ', navigate(`/order`)),
                button(category.name, navigate(`/menu/${category.id}`))
            ])
        )
    )
})

app.get('/order', (req, res) => {
    const authId = req.header('x-chatium-auth-id') || null

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
                            imageIcon(product.image),
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
    const authId = req.header('x-chatium-auth-id') || null

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
    const authId = req.header('x-chatium-auth-id') || null

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
    const vendor = express()
    vendor.use(cors())
    vendor.use(express.static('vendor'))

    vendor.get('*', (req, res) => {
        res.sendFile('vendor/index.html', {root: __dirname})
    })

    listen(vendor, 5000)
}

listen(app, process.env.PORT || 5050)
