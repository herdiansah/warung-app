import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding data...')

    // Seed Default Admin User
    const hashedPassword = await bcrypt.hash('123456', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@warung.com' },
        update: {},
        create: {
            name: 'Owner',
            email: 'admin@warung.com',
            password_hash: hashedPassword,
        },
    })
    console.log('Admin user seeded:', admin.email)

    // Seed Sample Products
    const products = [
        {
            name: 'Indomie Goreng',
            category: 'Makanan',
            purchase_price: 2500,
            selling_price: 3500,
            stock: 50,
            unit: 'BKS'
        },
        {
            name: 'Beras Mentik 5kg',
            category: 'Sembako',
            purchase_price: 60000,
            selling_price: 65000,
            stock: 10,
            unit: 'SAK'
        },
        {
            name: 'Telur Ayam 1kg',
            category: 'Sembako',
            purchase_price: 26000,
            selling_price: 29000,
            stock: 15,
            unit: 'KG'
        },
        {
            name: 'Kopi Kapal Api',
            category: 'Minuman',
            purchase_price: 1000,
            selling_price: 1500,
            stock: 100,
            unit: 'BKS'
        }
    ]

    for (const prod of products) {
        await prisma.product.create({
            data: prod
        })
    }

    console.log('Sample products seeded.')

    // Seed Default Settings (key-value)
    const defaultSettings = [
        { key: 'low_stock_threshold', value: '5' },
        { key: 'min_margin_percent', value: '10' },
    ]

    for (const s of defaultSettings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        })
    }
    console.log('Default settings seeded.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
