import { prisma } from './prisma';
import { cache } from 'react';

/**
 * ASC Ghana Homepage Data Service
 * All queries are cached at the request level using React's cache()
 * Prevents duplicate database calls during server-side rendering
 */

export const getHomePageStats = cache(async () => {
  try {
    const [memberCount, branchCount, upcomingEventsCount, projectCount] = await Promise.all([
      prisma.member.count({ where: { status: 'Active' } }),
      prisma.supportersGroup.count({ where: { isActive: true } }),
      prisma.event.count({
        where: { status: 'Published', date: { gte: new Date() } },
      }),
      prisma.communityProject.count({ where: { isActive: true } }),
    ]);

    return {
      totalMembers: memberCount,
      branches: branchCount,
      upcomingEvents: upcomingEventsCount,
      communityProjects: projectCount,
    };
  } catch (error) {
    console.error('Failed to fetch homepage stats:', error);
    return {
      totalMembers: 0,
      branches: 0,
      upcomingEvents: 0,
      communityProjects: 0,
    };
  }
});

export const getFeaturedNews = cache(async (limit = 3) => {
  try {
    return await prisma.newsArticle.findMany({
      where: { status: 'Published', featured: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        image: true,
        category: true,
        publishedAt: true,
        author: true,
        views: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch featured news:', error);
    return [];
  }
});

export const getUpcomingEvents = cache(async (limit = 3) => {
  try {
    return await prisma.event.findMany({
      where: { status: 'Published', date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        shortDescription: true,
        date: true,
        time: true,
        venue: true,
        image: true,
        category: true,
        isFree: true,
        memberPrice: true,
        capacity: true,
        booked: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch upcoming events:', error);
    return [];
  }
});

export const getMatchViewingCenters = cache(async (limit = 3) => {
  try {
    return await prisma.matchViewing.findMany({
      where: { status: 'Upcoming', isActive: true, matchDate: { gte: new Date() } },
      orderBy: { matchDate: 'asc' },
      take: limit,
      select: {
        id: true,
        matchTitle: true,
        competition: true,
        matchDate: true,
        kickoffTime: true,
        venue: true,
        address: true,
        capacity: true,
        rsvpCount: true,
        image: true,
        isFree: true,
        entryFee: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch match viewing centers:', error);
    return [];
  }
});

export const getMembershipTypes = cache(async () => {
  try {
    return await prisma.membershipType.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        renewalPrice: true,
        benefits: true,
        color: true,
        icon: true,
        isPopular: true,
        isFamily: true,
        familySize: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch membership types:', error);
    return [];
  }
});

export const getExecutiveCommittee = cache(async () => {
  try {
    return await prisma.executiveCommittee.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        position: true,
      },
    });
  } catch (error) {
    console.error('Failed to fetch executive committee:', error);
    return [];
  }
});

export const getCommunityProjects = cache(async (limit = 3) => {
  try {
    return await prisma.communityProject.findMany({
      where: { isActive: true },
      orderBy: { startDate: 'desc' },
      take: limit,
      include: {
        volunteers: {
          select: { id: true },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch community projects:', error);
    return [];
  }
});

export const getDonations = cache(async (limit = 2) => {
  try {
    return await prisma.donation.findMany({
      where: { status: 'Active' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        pledges: {
          select: { amount: true },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch donations:', error);
    return [];
  }
});

export const getGalleryAlbums = cache(async (limit = 3) => {
  try {
    return await prisma.galleryAlbum.findMany({
      where: { isPublic: true },
      orderBy: { sortOrder: 'asc' },
      take: limit,
      include: {
        images: {
          take: 8,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  } catch (error) {
    console.error('Failed to fetch gallery albums:', error);
    return [];
  }
});

export const getSupportersGroups = cache(async (limit = 4) => {
  try {
    return await prisma.supportersGroup.findMany({
      where: { isActive: true },
      orderBy: [{ memberCount: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  } catch (error) {
    console.error('Failed to fetch supporters groups:', error);
    return [];
  }
});

export const getSponsors = cache(async () => {
  try {
    return await prisma.sponsor.findMany({
      where: { active: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    });
  } catch (error) {
    console.error('Failed to fetch sponsors:', error);
    return [];
  }
});
