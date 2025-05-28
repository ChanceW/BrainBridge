import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'

// Helper function to generate themed questions based on category and interest
function generateThemedQuestion(category: string, interest: string, grade: number) {
  const themes: Record<string, Record<string, string[]>> = {
    Math: {
      Space: [
        'counting stars',
        'measuring planet distances',
        'calculating rocket speeds',
        'weighing meteorites',
        'timing space missions'
      ],
      Animals: [
        'counting zoo animals',
        'measuring animal weights',
        'calculating feeding schedules',
        'comparing animal speeds',
        'measuring habitat sizes'
      ],
      Music: [
        'counting musical beats',
        'measuring rhythm patterns',
        'calculating song durations',
        'comparing note frequencies',
        'timing musical sequences'
      ]
    },
    Science: {
      Space: [
        'planet facts',
        'solar system distances',
        'asteroid compositions',
        'space travel time',
        'gravity calculations'
      ],
      Animals: [
        'animal habitats',
        'food chain calculations',
        'species populations',
        'migration patterns',
        'growth rates'
      ],
      Music: [
        'sound waves',
        'frequency patterns',
        'acoustic measurements',
        'vibration patterns',
        'echo calculations'
      ]
    },
    'Social Studies': {
      Space: [
        'space exploration history',
        'astronaut demographics',
        'space program budgets',
        'international space cooperation',
        'space race timeline'
      ],
      Animals: [
        'wildlife conservation',
        'endangered species statistics',
        'animal population distribution',
        'habitat preservation',
        'species migration patterns'
      ],
      Music: [
        'cultural music traditions',
        'historical music periods',
        'global music styles',
        'music industry statistics',
        'musical instrument origins'
      ]
    },
    Geography: {
      Space: [
        'Which continent has the most space launch facilities?',
        'What is the latitude and longitude of the Kennedy Space Center?',
        'Which countries contribute to the International Space Station?',
        'How do satellites help in weather forecasting?',
        'Which countries have successfully landed on the Moon?'
      ],
      Animals: [
        'What continents are pandas native to?',
        'Which countries are part of the African elephant\'s natural habitat?',
        'What ocean contains the Great Barrier Reef?',
        'Which regions have the highest biodiversity?',
        'What countries are part of the monarch butterfly migration route?'
      ],
      Music: [
        'Which region is the birthplace of jazz music?',
        'What countries are known for classical music?',
        'Where did different musical instruments originate?',
        'Which regions are famous for their folk music traditions?',
        'What countries influenced modern pop music?'
      ]
    },
    Reading: {
      Space: [
        'space exploration books',
        'astronaut biographies',
        'science fiction analysis',
        'space mission reports',
        'astronomical articles'
      ],
      Animals: [
        'wildlife documentaries',
        'animal behavior studies',
        'nature writing',
        'species descriptions',
        'conservation reports'
      ],
      Music: [
        'song lyrics analysis',
        'music history texts',
        'composer biographies',
        'musical terminology',
        'concert reviews'
      ]
    },
    Biology: {
      Space: [
        'space biology experiments',
        'zero gravity effects',
        'radiation impact',
        'plant growth in space',
        'human adaptation'
      ],
      Animals: [
        'animal anatomy',
        'species evolution',
        'genetic patterns',
        'behavioral biology',
        'ecological relationships'
      ],
      Music: [
        'auditory system',
        'brain music processing',
        'vocal biology',
        'hearing mechanisms',
        'rhythm and nervous system'
      ]
    }
  }

  // Validate category and interest
  if (!themes[category]) {
    throw new Error(`Invalid category: ${category}. Valid categories are: ${Object.keys(themes).join(', ')}`)
  }
  if (!themes[category][interest]) {
    throw new Error(`Invalid interest: ${interest} for category: ${category}. Valid interests are: ${Object.keys(themes[category]).join(', ')}`)
  }

  // Get theme contexts for the category and interest
  const categoryThemes = themes[category][interest]
  const themeContext = categoryThemes[Math.floor(Math.random() * categoryThemes.length)]

  // Initialize variables with default values
  let question = `Question about ${themeContext}`
  let answer = 'Answer'
  let options: string[] = []
  let explanation = 'Explanation'

  // Adjust difficulty based on grade level
  const maxNumber = Math.min(grade * 15, 150)
  let num1 = Math.floor(Math.random() * maxNumber) + 1
  let num2 = Math.floor(Math.random() * maxNumber) + 1

  // Generate question based on category
  switch (category) {
    case 'Math':
      const operation = Math.floor(Math.random() * 4)
      switch (operation) {
        case 0: // Addition
          answer = (num1 + num2).toString()
          question = `If you have ${num1} ${themeContext} and find ${num2} more, how many do you have in total?`
          options = [
            answer,
            (num1 + num2 + 1).toString(),
            (num1 + num2 - 1).toString(),
            (num1 + num2 + 2).toString(),
          ]
          explanation = `${num1} plus ${num2} equals ${answer} ${themeContext}`
          break
        case 1: // Subtraction
          if (num1 < num2) [num1, num2] = [num2, num1]
          answer = (num1 - num2).toString()
          question = `If you start with ${num1} ${themeContext} and use ${num2}, how many remain?`
          options = [
            answer,
            (num1 - num2 + 1).toString(),
            (num1 - num2 - 1).toString(),
            (num1 - num2 + 2).toString(),
          ]
          explanation = `${num1} minus ${num2} equals ${answer} ${themeContext}`
          break
        case 2: // Multiplication
          answer = (num1 * num2).toString()
          question = `If you have ${num1} groups of ${num2} ${themeContext}, how many do you have in total?`
          options = [
            answer,
            ((num1 + 1) * num2).toString(),
            (num1 * (num2 + 1)).toString(),
            ((num1 - 1) * num2).toString(),
          ]
          explanation = `${num1} groups of ${num2} equals ${answer} ${themeContext}`
          break
        case 3: // Division
          const product = num1 * num2
          answer = num1.toString()
          question = `If you have ${product} ${themeContext} shared among ${num2} groups, how many are in each group?`
          options = [
            answer,
            (num1 + 1).toString(),
            (num1 - 1).toString(),
            (num1 + 2).toString(),
          ]
          explanation = `${product} divided by ${num2} equals ${answer} ${themeContext} per group`
          break
      }
      break

    case 'Geography':
      const geographyAnswers: Record<string, string[]> = {
        Space: [
          'Asia has the most space launch facilities, including sites in China, India, and Kazakhstan',
          'The Kennedy Space Center is located at 28.5729° N, 80.6490° W in Florida, USA',
          'The United States, Russia, Japan, Canada, and European Union countries contribute to the ISS',
          'Satellites track cloud patterns, storms, and atmospheric conditions globally',
          'The United States, Russia (USSR), and China have successfully landed on the Moon'
        ],
        Animals: [
          'Pandas are native to Asia, specifically in the mountains of southwestern China',
          'African elephants live in sub-Saharan Africa, including countries like Kenya, Tanzania, and Botswana',
          'The Great Barrier Reef is located in the Pacific Ocean off the coast of Australia',
          'The Amazon rainforest, Congo Basin, and Southeast Asian islands have the highest biodiversity',
          'The monarch butterfly migration spans from Canada through the United States to Mexico'
        ],
        Music: [
          'Jazz originated in New Orleans, United States, in the late 19th century',
          'Austria, Germany, and Italy are historically known for classical music',
          'Many instruments have origins in Asia, Africa, and Europe',
          'Celtic music in Ireland, Flamenco in Spain, and Samba in Brazil are famous folk traditions',
          'American and British music heavily influenced modern pop music globally'
        ]
      }

      const questionIndex = Math.floor(Math.random() * 5)
      question = themes[category][interest][questionIndex]
      answer = geographyAnswers[interest][questionIndex]
      
      // Generate plausible but incorrect answers based on the theme
      const wrongAnswers = generateGeographyWrongAnswers(interest, questionIndex)
      options = [answer, ...wrongAnswers]
      explanation = `The correct answer is: ${answer}. This is an important geographic fact about ${interest}.`
      break;

    default:
      // For non-math categories, generate multiple choice questions based on the theme
      const facts = themes[category]?.[interest] || ['general fact']
      const fact = facts[Math.floor(Math.random() * facts.length)]
      question = `Question about ${fact} in ${category}`
      answer = `Correct answer about ${fact}`
      options = [
        answer,
        `Wrong answer 1 about ${fact}`,
        `Wrong answer 2 about ${fact}`,
        `Wrong answer 3 about ${fact}`,
      ]
      explanation = `Explanation about ${fact} in ${category}`
  }

  // Shuffle options
  options.sort(() => Math.random() - 0.5)

  return {
    content: question,
    options,
    answer,
    explanation,
  }
}

// Main function to generate worksheet questions
function generateWorksheetQuestions(student: any) {
  const questions = []
  
  // Validate student has categories and interests
  if (!student.categories?.length) {
    throw new Error('Student must have at least one category selected')
  }
  if (!student.interests?.length) {
    throw new Error('Student must have at least one interest selected')
  }
  
  // Randomly select a category from student's categories
  const category = student.categories[Math.floor(Math.random() * student.categories.length)]
  
  // Randomly select an interest from student's interests
  const interest = student.interests[Math.floor(Math.random() * student.interests.length)]
  
  // Generate 15 regular questions
  for (let i = 0; i < 15; i++) {
    questions.push(generateThemedQuestion(category, interest, student.grade))
  }
  
  // Generate 5 special interest-themed questions
  for (let i = 0; i < 5; i++) {
    questions.push(generateThemedQuestion(category, interest, student.grade))
  }

  return {
    questions,
    category,
    interest
  }
}

// Add this helper function for generating wrong answers
function generateGeographyWrongAnswers(interest: string, questionIndex: number): string[] {
  const wrongAnswers: Record<string, string[][]> = {
    Space: [
      [
        'Europe has the most space launch facilities, including sites in France and Germany',
        'North America has the most space launch facilities, including sites in the USA and Canada',
        'South America has the most space launch facilities, including sites in Brazil and Argentina'
      ],
      [
        'The Kennedy Space Center is located at 35.1234° N, 75.5678° W in Texas, USA',
        'The Kennedy Space Center is located at 42.8901° N, 88.2345° W in California, USA',
        'The Kennedy Space Center is located at 31.7890° N, 84.5678° W in Georgia, USA'
      ],
      [
        'Only the United States and Russia contribute to the ISS',
        'The United States, China, and North Korea contribute to the ISS',
        'All UN member countries contribute equally to the ISS'
      ],
      [
        'Satellites are primarily used for television broadcasting only',
        'Satellites can only track weather during daylight hours',
        'Satellites are mainly used for GPS navigation, not weather'
      ],
      [
        'Only the United States has successfully landed on the Moon',
        'The United States, Japan, and India have successfully landed on the Moon',
        'All space-capable countries have successfully landed on the Moon'
      ]
    ],
    Animals: [
      [
        'Pandas are native to South America, specifically in the Andes Mountains',
        'Pandas are native to Europe, specifically in the Alps',
        'Pandas are native to North America, specifically in the Rocky Mountains'
      ],
      [
        'African elephants live only in North Africa, including Egypt and Morocco',
        'African elephants live throughout all of Africa without restriction',
        'African elephants live only in South Africa and Madagascar'
      ],
      [
        'The Great Barrier Reef is located in the Atlantic Ocean off the coast of Florida',
        'The Great Barrier Reef is located in the Indian Ocean off the coast of India',
        'The Great Barrier Reef is located in the Mediterranean Sea off the coast of Greece'
      ],
      [
        'Only the Amazon rainforest has high biodiversity',
        'The Sahara Desert and Arctic regions have the highest biodiversity',
        'Only island nations have significant biodiversity'
      ],
      [
        'The monarch butterfly migration only occurs in South America',
        'The monarch butterfly migration is only between Europe and Africa',
        'The monarch butterfly migration only happens in Asia'
      ]
    ],
    Music: [
      [
        'Jazz originated in Paris, France, in the early 20th century',
        'Jazz originated in London, England, in the mid-20th century',
        'Jazz originated in Chicago, United States, in the 1950s'
      ],
      [
        'Only Italy is known for classical music',
        'Classical music originated exclusively in Russia',
        'Classical music is primarily from Asia'
      ],
      [
        'All musical instruments originated in Europe',
        'Musical instruments were only developed in the Americas',
        'All instruments have ancient Greek origins'
      ],
      [
        'Folk music traditions only exist in North America',
        'Traditional music is only found in Asia',
        'Folk music is exclusive to African cultures'
      ],
      [
        'Only Asian music influenced modern pop',
        'Modern pop music evolved solely from African traditions',
        'Pop music developed independently in each country'
      ]
    ]
  }

  return wrongAnswers[interest][questionIndex]
}

export async function POST() {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const student = await prisma.student.findFirst({
      where: {
        userName: session.user.email,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if there's already an incomplete worksheet for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const existingWorksheet = await prisma.worksheet.findFirst({
      where: {
        studentId: student.id,
        createdAt: {
          gte: today,
        },
        status: {
          not: 'COMPLETED',
        },
      },
    })

    if (existingWorksheet) {
      return NextResponse.json(
        { error: 'Incomplete worksheet already exists for today' },
        { status: 400 }
      )
    }

    try {
      // Generate new worksheet with themed questions
      const { questions, category, interest } = generateWorksheetQuestions(student)
      
      const worksheet = await prisma.worksheet.create({
        data: {
          title: `${category} Practice - ${interest} Theme`,
          description: `A worksheet focusing on ${category} with ${interest}-themed questions.`,
          subject: category,
          grade: student.grade,
          studentId: student.id,
          questions: {
            create: questions.map(q => ({
              content: q.content,
              options: q.options,
              answer: q.answer,
              explanation: q.explanation,
            }))
          }
        },
        include: {
          questions: true
        }
      })

      return NextResponse.json(worksheet)
    } catch (error) {
      // Handle validation errors from generateWorksheetQuestions
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error // Re-throw if it's not a validation error
    }
  } catch (error) {
    console.error('Error generating worksheet:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 