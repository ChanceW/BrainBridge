import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create a test parent
  const hashedParentPassword = await bcrypt.hash('parent123', 10)
  const parent = await prisma.parent.create({
    data: {
      email: 'parent@example.com',
      password: hashedParentPassword,
      name: 'Test Parent',
      resetToken: null,
      resetTokenExpiry: null,
    },
  })

  // Create a test student
  const hashedStudentPassword = await bcrypt.hash('student123', 10)
  const student = await prisma.student.create({
    data: {
      userName: 'student1',
      password: hashedStudentPassword,
      name: 'Test Student',
      grade: 5,
      categories: ['Math', 'Science'],
      interests: ['Space', 'Animals'],
      parentId: parent.id,
    },
  })

  // Create a test worksheet
  await prisma.worksheet.create({
    data: {
      title: 'Basic Math Quiz',
      description: 'Practice your basic math skills',
      subject: 'Math',
      grade: 5,
      studentId: student.id,
      questions: {
        create: [
          {
            content: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            answer: '4',
            explanation: 'Two plus two equals four',
          },
          {
            content: 'What is 5 x 3?',
            options: ['10', '12', '15', '18'],
            answer: '15',
            explanation: 'Five times three equals fifteen',
          },
        ],
      },
    },
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 