import { UserProfile } from '../types';

export function getMatchReasons(user1: UserProfile, user2: UserProfile): string[] {
  if (!user1 || !user2) return [];
  
  const reasons: string[] = [];
  
  // Shared Industry
  if (user1.industry && user2.industry && user1.industry.toLowerCase() === user2.industry.toLowerCase()) {
    reasons.push(`Similar Industry (${user1.industry})`);
  }

  // Matching Skills
  if (user1.userType === 'founder' && user2.userType === 'builder' && user1.lookingFor) {
    const matchingSkills = user2.skills?.filter(s => user1.lookingFor?.includes(s));
    if (matchingSkills && matchingSkills.length > 0) {
      reasons.push(`Matching Skills: ${matchingSkills.slice(0, 2).join(', ')}`);
    } else {
      reasons.push(`Looking for builders`);
    }
  } else if (user2.userType === 'founder' && user1.userType === 'builder' && user2.lookingFor) {
    const matchingSkills = user1.skills?.filter(s => user2.lookingFor?.includes(s));
    if (matchingSkills && matchingSkills.length > 0) {
      reasons.push(`Matching Skills: ${matchingSkills.slice(0, 2).join(', ')}`);
    }
  } else {
    // Both same type or builders matching builders
    const hasDifferentSkills = user1.skills?.some(s => !user2.skills?.includes(s));
    if (hasDifferentSkills) reasons.push(`Complementary Roles`);
  }
  
  // Shared Interests
  const sharedInterests = user1.interests?.filter(i => user2.interests?.includes(i));
  if (sharedInterests && sharedInterests.length > 0) {
    reasons.push(`Shared Interests (${sharedInterests[0]})`);
  }
  
  // Commitment
  if (user1.commitment === user2.commitment && user1.commitment) {
    reasons.push(`Similar Commitment (${user1.commitment})`);
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
