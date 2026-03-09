import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding data...')

    // Seed Default Admin User
    const admin = await prisma.user.upsert({
        where: { email: 'admin@warung.com' },
        update: {},
        create: {
            name: 'Owner',
            email: 'admin@warung.com',
            password_hash: '123456', // using plain string for MVP simplicity as per SQLite version earlier
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
