import { UserProfile } from '../types';

export function getMatchReasons(user1: UserProfile, user2: UserProfile): string[] {
  if (!user1 || !user2) return [];
  
  const reasons: string[] = [];
  
  // Shared Interests
  const sharedInterests = user1.interests.filter(i => user2.interests.includes(i));
  if (sharedInterests.length > 0) {
    reasons.push(`Interested in ${sharedInterests[0]}`);
  }
  
  // Founder / Builder compliment
  if (user1.userType === 'founder' && user2.userType === 'builder' && user1.lookingFor) {
    const matchingSkills = user2.skills.filter(s => user1.lookingFor?.includes(s));
    if (matchingSkills.length > 0) {
      reasons.push(`${matchingSkills[0]} skill matches startup need`);
    } else {
      reasons.push(`Looking for builders to join team`);
    }
  } else if (user2.userType === 'founder' && user1.userType === 'builder' && user2.lookingFor) {
    const matchingSkills = user1.skills.filter(s => user2.lookingFor?.includes(s));
    if (matchingSkills.length > 0) {
      reasons.push(`${matchingSkills[0]} skill matches startup need`);
    }
  } else {
    const hasDifferentSkills = user1.skills.some(s => !user2.skills.includes(s));
    if (hasDifferentSkills) reasons.push(`Complementary skills`);
  }
  
  // Commitment
  if (user1.commitment === user2.commitment) {
    reasons.push(`Similar Commitment Level`);
  }
  
  // Location
  if (user1.city && user2.city && user1.city.toLowerCase() === user2.city.toLowerCase()) {
    reasons.push(`Based in same city`);
  }
  
  if (reasons.length === 0) {
    reasons.push(`Great potential teammate`);
  }
  
  // Return top 3 reasons
  return reasons.slice(0, 3);
}
