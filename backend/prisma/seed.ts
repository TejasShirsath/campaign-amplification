import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800',
  'https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=800',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800',
  'https://images.unsplash.com/photo-1559825481-12a05cc00344?w=800',
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Create a demo user (won't conflict with real Auth0 users)
  const demoUser = await prisma.user.upsert({
    where: { authSubject: 'demo|seed-user-001' },
    update: {},
    create: {
      authSubject: 'demo|seed-user-001',
      email: 'demo@campaignamplify.dev',
      name: 'Demo Creator',
      displayName: 'CampaignAmp Demo',
      bio: 'A demonstration creator account for the Campaign Amplification Platform.',
    },
  });

  const backerUser = await prisma.user.upsert({
    where: { authSubject: 'demo|seed-user-002' },
    update: {},
    create: {
      authSubject: 'demo|seed-user-002',
      email: 'backer@campaignamplify.dev',
      name: 'Demo Backer',
      displayName: 'Eco Supporter',
      bio: 'Passionate about amplifying messages that matter.',
    },
  });

  console.log(`  ✓ Users created: ${demoUser.id}, ${backerUser.id}`);

  // Campaign data
  const campaignsData = [
    {
      title: 'Save the Western Ghats Rainforest',
      category: 'ENVIRONMENT' as const,
      creatorName: 'Green Earth Foundation',
      summary: 'The Western Ghats biodiversity hotspot is under threat from deforestation. Help amplify the message to reach decision-makers and the public.',
      coverImageUrl: SAMPLE_IMAGES[0],
      headline: 'Protecting One of the World\'s Most Biodiverse Regions',
      introText: 'The Western Ghats, a UNESCO World Heritage Site, is home to over 7,402 species of flowering plants, 1,814 species of non-flowering plants, 139 mammal species, and 508 bird species. Yet, it faces unprecedented threats from mining, logging, and urbanization.',
      storyContent: [
        { id: '1', type: 'text', content: 'Every year, thousands of hectares of pristine rainforest are lost. Our campaign aims to raise awareness among 500,000 people about the importance of preserving this ecological treasure.' },
        { id: '2', type: 'statistic', value: '60%', label: 'of original forest cover lost in the last century' },
        { id: '3', type: 'text', content: 'With your support, we can fund targeted advertising campaigns that reach policy makers, students, and communities living near the Western Ghats.' },
      ],
      sources: [
        { title: 'UNESCO - Western Ghats', url: 'https://whc.unesco.org/en/list/1342/' },
        { title: 'IUCN Conservation Report', url: 'https://www.iucn.org/resources/publications' },
      ],
      fundingGoalPaise: 5000000, // ₹50,000
      estimatedReach: 500000,
      status: 'FUNDING' as const,
      isFeatured: true,
      totalRaisedPaise: 2350000,
      contributorCount: 47,
      campaignDuration: 45,
    },
    {
      title: 'Mental Health Awareness in Indian Schools',
      category: 'HEALTH' as const,
      creatorName: 'MindWell India',
      summary: 'Breaking the stigma around mental health in schools through targeted awareness campaigns reaching parents, teachers, and students.',
      coverImageUrl: SAMPLE_IMAGES[1],
      headline: 'Every Child Deserves Mental Health Support',
      introText: 'Studies show that 1 in 5 Indian adolescents experience mental health challenges. Yet, most schools lack adequate mental health resources and awareness programs.',
      storyContent: [
        { id: '1', type: 'text', content: 'Our campaign will fund advertisements on social media and educational platforms to reach 200,000 parents and educators with information about recognizing signs of mental health issues in children.' },
        { id: '2', type: 'statistic', value: '80%', label: 'of schools lack mental health counselors' },
      ],
      sources: [
        { title: 'NIMHANS Study on Adolescent Mental Health', url: 'https://nimhans.ac.in' },
        { title: 'WHO Mental Health Atlas', url: 'https://www.who.int/publications/i/item/mental-health-atlas-2020' },
      ],
      fundingGoalPaise: 3000000, // ₹30,000
      estimatedReach: 200000,
      status: 'FUNDING' as const,
      isFeatured: true,
      totalRaisedPaise: 1800000,
      contributorCount: 32,
      campaignDuration: 30,
    },
    {
      title: 'Support Open-Source Science Research',
      category: 'SCIENCE' as const,
      creatorName: 'OpenSci Collective',
      summary: 'Promoting open access to scientific research papers and data. Help us spread the word about the importance of open science.',
      coverImageUrl: SAMPLE_IMAGES[2],
      headline: 'Science Should Be Open to Everyone',
      introText: 'Millions of publicly funded research papers are locked behind expensive paywalls. Our campaign advocates for open access to scientific knowledge.',
      storyContent: [
        { id: '1', type: 'text', content: 'We want to reach university students, researchers, and policymakers with the message that open science accelerates innovation and equity.' },
      ],
      sources: [
        { title: 'Budapest Open Access Initiative', url: 'https://www.budapestopenaccessinitiative.org' },
      ],
      fundingGoalPaise: 2000000, // ₹20,000
      estimatedReach: 150000,
      status: 'FUNDING' as const,
      isFeatured: false,
      totalRaisedPaise: 500000,
      contributorCount: 12,
      campaignDuration: 30,
    },
    {
      title: 'Digital Literacy for Rural Women',
      category: 'EDUCATION' as const,
      creatorName: 'EmpowerHer Tech',
      summary: 'Amplifying the message about digital literacy programs available for women in rural India to bridge the digital divide.',
      coverImageUrl: SAMPLE_IMAGES[3],
      headline: 'Bridging the Digital Gender Divide',
      introText: 'Only 21% of women in rural India use the internet compared to 42% of men. Digital literacy can transform livelihoods and access to services.',
      storyContent: [
        { id: '1', type: 'text', content: 'Our campaign targets rural communities across 5 states through local language ads on social media and regional news platforms.' },
        { id: '2', type: 'statistic', value: '21%', label: 'of rural Indian women use the internet' },
      ],
      sources: [
        { title: 'IAMAI Digital in India Report', url: 'https://www.iamai.in' },
      ],
      fundingGoalPaise: 4000000, // ₹40,000
      estimatedReach: 300000,
      status: 'APPROVED' as const,
      isFeatured: true,
      totalRaisedPaise: 0,
      contributorCount: 0,
      campaignDuration: 60,
    },
    {
      title: 'Clean Air Campaign for Delhi NCR',
      category: 'PUBLIC_POLICY' as const,
      creatorName: 'Breathe Delhi Initiative',
      summary: 'Demanding stronger air quality regulations through a targeted awareness campaign reaching citizens and lawmakers in Delhi NCR.',
      coverImageUrl: SAMPLE_IMAGES[4],
      headline: 'Clean Air Is a Right, Not a Privilege',
      introText: 'Delhi consistently ranks among the world\'s most polluted cities. Our campaign brings attention to practical solutions and policy demands.',
      storyContent: [
        { id: '1', type: 'text', content: 'We will amplify evidence-based air quality solutions to 1 million residents and key policymakers through targeted digital advertising.' },
      ],
      sources: [
        { title: 'IQAir World Air Quality Report', url: 'https://www.iqair.com/world-most-polluted-cities' },
      ],
      fundingGoalPaise: 7500000, // ₹75,000
      estimatedReach: 1000000,
      status: 'COMPLETED' as const,
      isFeatured: true,
      totalRaisedPaise: 7500000,
      contributorCount: 156,
      campaignDuration: 30,
    },
    {
      title: 'Community Garden Revival in Bangalore',
      category: 'COMMUNITY' as const,
      creatorName: 'Urban Green Bangalore',
      summary: 'Spreading awareness about community gardening spaces available in Bangalore to promote urban agriculture and green spaces.',
      coverImageUrl: SAMPLE_IMAGES[5],
      headline: 'Grow Together, Green Together',
      introText: 'Bangalore has lost 78% of its green cover in the last two decades. Community gardens offer a sustainable solution for urban food production and recreation.',
      storyContent: [],
      sources: [],
      fundingGoalPaise: 1500000,
      estimatedReach: 100000,
      status: 'DRAFT' as const,
      isFeatured: false,
      totalRaisedPaise: 0,
      contributorCount: 0,
      campaignDuration: 30,
    },
    {
      title: 'Preserving Classical Indian Music Traditions',
      category: 'ARTS_CULTURE' as const,
      creatorName: 'Raga Foundation',
      summary: 'A campaign to promote awareness and appreciation of classical Indian music traditions among younger generations.',
      coverImageUrl: SAMPLE_IMAGES[6],
      headline: 'Keep the Ragas Alive',
      introText: 'India\'s rich classical music heritage is at risk of being forgotten. Help us reach young audiences through digital platforms.',
      storyContent: [
        { id: '1', type: 'text', content: 'Through targeted social media campaigns and partnerships with music education platforms, we aim to introduce 100,000 young people to classical Indian music.' },
      ],
      sources: [
        { title: 'UNESCO Intangible Cultural Heritage', url: 'https://ich.unesco.org' },
      ],
      fundingGoalPaise: 2500000,
      estimatedReach: 100000,
      status: 'SUBMITTED' as const,
      isFeatured: false,
      totalRaisedPaise: 0,
      contributorCount: 0,
      campaignDuration: 45,
    },
    {
      title: 'Support Local Small Businesses Recovery',
      category: 'BUSINESS' as const,
      creatorName: 'ShopLocal India',
      summary: 'Amplifying the message to shop local and support small businesses that are still recovering from pandemic impacts.',
      coverImageUrl: SAMPLE_IMAGES[7],
      headline: 'Shop Local, Build Communities',
      introText: 'Over 10 million small businesses closed during the pandemic. Those that survived need community support now more than ever.',
      storyContent: [
        { id: '1', type: 'text', content: 'Our campaign will promote local businesses through geo-targeted advertising in 10 major Indian cities.' },
        { id: '2', type: 'statistic', value: '10M+', label: 'small businesses affected by the pandemic' },
      ],
      sources: [
        { title: 'MSME Ministry Annual Report', url: 'https://msme.gov.in' },
      ],
      fundingGoalPaise: 6000000,
      estimatedReach: 750000,
      status: 'FUNDING' as const,
      isFeatured: true,
      totalRaisedPaise: 4200000,
      contributorCount: 89,
      campaignDuration: 60,
    },
  ];

  for (const campaignData of campaignsData) {
    const {
      storyContent,
      sources,
      status,
      totalRaisedPaise,
      contributorCount,
      ...restData
    } = campaignData;

    const existingCampaign = await prisma.campaign.findFirst({
      where: { title: restData.title, creatorId: demoUser.id },
    });

    if (existingCampaign) {
      console.log(`  ⏭ Campaign already exists: "${restData.title}"`);
      continue;
    }

    const campaign = await prisma.campaign.create({
      data: {
        creatorId: demoUser.id,
        status,
        title: restData.title,
        category: restData.category,
        creatorName: restData.creatorName,
        summary: restData.summary,
        coverImageUrl: restData.coverImageUrl,
        headline: restData.headline,
        introText: restData.introText,
        storyContent: storyContent as any,
        sources: sources as any,
        fundingGoalPaise: restData.fundingGoalPaise,
        estimatedReach: restData.estimatedReach,
        isFeatured: restData.isFeatured,
        totalRaisedPaise,
        contributorCount,
        campaignDuration: restData.campaignDuration,
        agreedToTerms: status !== 'DRAFT',
        submittedAt: ['SUBMITTED', 'APPROVED', 'FUNDING', 'FUNDED', 'COMPLETED'].includes(status) ? new Date() : null,
        approvedAt: ['APPROVED', 'FUNDING', 'FUNDED', 'COMPLETED'].includes(status) ? new Date() : null,
        fundingEndsAt: ['FUNDING'].includes(status)
          ? new Date(Date.now() + (restData.campaignDuration || 30) * 24 * 60 * 60 * 1000)
          : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        completedSteps: status === 'DRAFT'
          ? ['basics', 'story']
          : ['basics', 'story', 'visuals', 'reach', 'submit'],
        targetLocations: ['India'] as any,
        distributionChannels: ['Social Media', 'Display Ads'] as any,
      },
    });

    // Create campaign event
    await prisma.campaignEvent.create({
      data: {
        campaignId: campaign.id,
        userId: demoUser.id,
        type: 'created',
        title: 'Campaign created',
      },
    });

    // Add a creative for non-draft campaigns
    if (status !== 'DRAFT' && restData.coverImageUrl) {
      await prisma.campaignCreative.create({
        data: {
          campaignId: campaign.id,
          type: 'cover',
          url: restData.coverImageUrl,
          headline: restData.headline || restData.title,
          description: restData.summary?.substring(0, 200) || null,
          callToAction: 'Learn More',
          sortOrder: 0,
        },
      });
    }

    // Add distribution report for completed campaigns
    if (status === 'COMPLETED') {
      await prisma.distributionReport.create({
        data: {
          campaignId: campaign.id,
          totalRaisedPaise,
          adSpendPaise: Math.round(totalRaisedPaise * 0.85), // 85% goes to ads
          platformFeePaise: Math.round(totalRaisedPaise * 0.05),
          impressions: Math.round((restData.estimatedReach || 0) * 1.2),
          clicks: Math.round((restData.estimatedReach || 0) * 0.03),
          estimatedReach: restData.estimatedReach || 0,
          measuredReach: Math.round((restData.estimatedReach || 0) * 0.95),
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          metadata: {
            platforms: ['Instagram', 'Facebook', 'Google Ads'],
            topLocations: ['Delhi', 'Mumbai', 'Bangalore'],
          },
        },
      });
    }

    console.log(`  ✓ Campaign created: "${restData.title}" (${status})`);
  }

  // Create some sample contributions for funding campaigns
  const fundingCampaigns = await prisma.campaign.findMany({
    where: { status: 'FUNDING', creatorId: demoUser.id },
    take: 2,
  });

  for (const campaign of fundingCampaigns) {
    const existingContribution = await prisma.contribution.findFirst({
      where: { campaignId: campaign.id, userId: backerUser.id },
    });

    if (!existingContribution) {
      await prisma.contribution.create({
        data: {
          campaignId: campaign.id,
          userId: backerUser.id,
          amountPaise: 50000, // ₹500
          platformFeePaise: 2500,
          totalPaise: 52500,
          status: 'CONFIRMED',
          isAnonymous: true,
        },
      });
      console.log(`  ✓ Sample contribution added for "${campaign.title}"`);
    }
  }

  // Create sample notifications
  const notificationExists = await prisma.notification.findFirst({
    where: { userId: demoUser.id },
  });

  if (!notificationExists) {
    await prisma.notification.createMany({
      data: [
        {
          userId: demoUser.id,
          type: 'CAMPAIGN_APPROVED',
          title: 'Campaign Approved!',
          message: 'Your campaign "Save the Western Ghats Rainforest" has been approved and is now open for funding.',
          isRead: false,
        },
        {
          userId: demoUser.id,
          type: 'FUNDING_MILESTONE',
          title: '50% Funded!',
          message: '"Save the Western Ghats Rainforest" has reached 50% of its funding goal!',
          isRead: true,
        },
        {
          userId: demoUser.id,
          type: 'CONTRIBUTION_SUCCESSFUL',
          title: 'New Contribution Received',
          message: 'Someone backed your campaign "Mental Health Awareness in Indian Schools" with a contribution.',
          isRead: false,
        },
      ],
    });
    console.log('  ✓ Sample notifications created');
  }

  console.log('\n✅ Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
