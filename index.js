const express = require('express')
const cors = require('cors')

const { response, screen, text, button, image, listItem, imageIcon } = require('./chatium/json')
const { navigate, copyToClipboard } = require('./chatium/actions')

const categories = require('./data/categories')
const products = require('./data/products')

const app = express()
app.use(cors())

app.get('/', (req, res) => {
    res.json(
        response(
            screen('Ресторан Cassa di Famiglia', [
                text('Рекламная акция индуктивно порождает фирменный стиль, используя опыт предыдущих кампаний. Представляется логичным, что анализ рыночных цен многопланово отталкивает сублимированный баинг и селлинг. Лидерство в продажах, безусловно, синхронизирует презентационный материал.'),
                image('https://fs.chatium.io/fileservice/file/download/h/image_QKwNFH2SsM.1000x715.png'),
                text('Целевая аудитория, в рамках сегодняшних воззрений, исключительно искажает коллективный имидж. Ребрендинг отталкивает комплексный целевой трафик, учитывая результат предыдущих медиа-кампаний. Еще Траут показал, что воздействие на потребителя стабилизирует мониторинг активности, размещаясь во всех медиа. А вот по мнению аналитиков медиаплан развивает рекламный бриф. Product placement абстрактен. Поисковая реклама актаульна как никогда.'),
                button('Меню ресторана', navigate('/menu')),
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
    const accountId = req.header('x-chatium-account-id') ? req.header('x-chatium-account-id') : '–'
    const authId = req.header('x-chatium-auth-id') ? req.header('x-chatium-auth-id') : '–'
    const userId = req.header('x-chatium-user-id') ? req.header('x-chatium-user-id') : '–'

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
    const category = categories.find(category => category.id === req.params.category)
    const product = products.find(product => product.id === req.params.product)

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
                button(category.name, navigate(`/menu/${category.id}`))
            ])
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

listen(app, 5050)
