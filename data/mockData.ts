export interface User {
  id: string;
  username: string;
  points: number;
  challengesCompleted: number;
  avatarUrl?: string;
}

export interface Photo {
  id: string;
  userId: string;
  username: string;
  uri: string;
  challengeId: string;
  challengeTitle: string;
  challengePoints: number;
  timestamp: number;
  aspectRatio: number;
  verified: boolean;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  points: number;
  completed: boolean;
  completedBy?: string[]; // user IDs who completed this challenge
}

export interface Post {
  id: string;
  username: string;
  userId: string;
  challengeId: string;
  challengeDescription: string;
  challengePoints: number;
  photoUri: string;
  timestamp: number;
  aspectRatio: number;
}

// Current user (for demo purposes)
export const CURRENT_USER_ID = 'current_user';
export const CURRENT_USERNAME = 'fighter_one';

// Mock users
const initialUsers: User[] = [
  { id: CURRENT_USER_ID, username: CURRENT_USERNAME, points: 0, challengesCompleted: 0 },
  { id: '1', username: 'photo_king', points: 78, challengesCompleted: 24 },
  { id: '2', username: 'snapshot_pro', points: 65, challengesCompleted: 18 },
  { id: '3', username: 'camera_master', points: 52, challengesCompleted: 15 },
  { id: '4', username: 'lens_lover', points: 45, challengesCompleted: 12 },
  { id: '5', username: 'click_champion', points: 38, challengesCompleted: 10 },
  { id: '6', username: 'shutter_bug', points: 31, challengesCompleted: 9 },
  { id: '7', username: 'frame_fighter', points: 26, challengesCompleted: 8 },
  { id: '8', username: 'pixel_perfect', points: 19, challengesCompleted: 6 },
  { id: '9', username: 'focus_fanatic', points: 14, challengesCompleted: 4 },
  { id: '10', username: 'image_hero', points: 8, challengesCompleted: 3 },
];

// Mock challenges (points 1-9 = difficulty level)
const initialChallenges: Challenge[] = [
  { id: '1', title: 'Snap something blue', description: 'Find and photograph something blue', points: 1, completed: false, completedBy: ['1', '2'] },
  { id: '2', title: 'Snap a cup', description: 'Photograph any cup or mug', points: 1, completed: false, completedBy: ['1', '3', '4'] },
  { id: '3', title: 'Snap food', description: 'Take a photo of your meal', points: 2, completed: false, completedBy: ['2', '5'] },
  { id: '4', title: 'Snap a smile', description: 'Capture someone smiling', points: 3, completed: false, completedBy: ['1', '6'] },
  { id: '5', title: 'Snap nature', description: 'Photograph something from nature', points: 4, completed: false, completedBy: ['3', '7'] },
  { id: '6', title: 'Snap architecture', description: 'Photograph a building or structure', points: 5, completed: false, completedBy: ['4'] },
  { id: '7', title: 'Snap a sunset', description: 'Capture the sunset', points: 6, completed: false, completedBy: [] },
  { id: '8', title: 'Snap graffiti', description: 'Find and photograph street art', points: 7, completed: false, completedBy: [] },
  { id: '9', title: 'Snap a reflection in water', description: 'Capture a reflection in water', points: 8, completed: false, completedBy: [] },
  { id: '10', title: 'Snap lightning', description: 'Photograph lightning (good luck!)', points: 9, completed: false, completedBy: [] },
];

// Challenge titles with their points
const challengeData = [
  { title: 'Snap something blue', points: 1 },
  { title: 'Snap a cup', points: 1 },
  { title: 'Snap food', points: 2 },
  { title: 'Snap a smile', points: 3 },
  { title: 'Snap nature', points: 4 },
  { title: 'Snap architecture', points: 5 },
  { title: 'Snap a sunset', points: 6 },
  { title: 'Snap graffiti', points: 7 },
  { title: 'Snap a reflection', points: 8 },
  { title: 'Snap lightning', points: 9 },
  { title: 'Snap a pet', points: 2 },
  { title: 'Snap flowers', points: 3 },
  { title: 'Snap the sky', points: 1 },
  { title: 'Snap water', points: 4 },
  { title: 'Snap a book', points: 2 },
  { title: 'Snap shoes', points: 1 },
  { title: 'Snap a door', points: 3 },
  { title: 'Snap stairs', points: 4 },
  { title: 'Snap a window', points: 2 },
  { title: 'Snap a shadow', points: 5 },
  { title: 'Snap a tree', points: 3 },
  { title: 'Snap a car', points: 2 },
  { title: 'Snap a sign', points: 1 },
  { title: 'Snap a pattern', points: 4 },
];

// Generate mock photos based on user's challengesCompleted
const generateUserPhotos = (user: { id: string; username: string; challengesCompleted: number }, startId: number): { photos: Photo[], totalPoints: number } => {
  const photos: Photo[] = [];
  const aspectRatios = [1, 0.8, 1.91, 0.67, 1.78, 4/3];
  let totalPoints = 0;
  
  for (let i = 0; i < user.challengesCompleted; i++) {
    const challengeIndex = i % challengeData.length;
    const challenge = challengeData[challengeIndex];
    totalPoints += challenge.points;
    
    photos.push({
      id: `${startId + i}`,
      userId: user.id,
      username: user.username,
      uri: `https://picsum.photos/800/800?random=${startId + i}`,
      challengeId: `${(i % 10) + 1}`,
      challengeTitle: challenge.title,
      challengePoints: challenge.points,
      timestamp: Date.now() - (i + 1) * 3600000, // 1 hour apart
      aspectRatio: aspectRatios[i % aspectRatios.length],
      verified: true,
    });
  }
  return { photos, totalPoints };
};

// Generate photos for all users and calculate their actual points
const generateAllPhotosAndUpdateUsers = (): { photos: Photo[], userPoints: Map<string, number> } => {
  const usersWithChallenges = [
    { id: '1', username: 'photo_king', challengesCompleted: 24 },
    { id: '2', username: 'snapshot_pro', challengesCompleted: 18 },
    { id: '3', username: 'camera_master', challengesCompleted: 15 },
    { id: '4', username: 'lens_lover', challengesCompleted: 12 },
    { id: '5', username: 'click_champion', challengesCompleted: 10 },
    { id: '6', username: 'shutter_bug', challengesCompleted: 9 },
    { id: '7', username: 'frame_fighter', challengesCompleted: 8 },
    { id: '8', username: 'pixel_perfect', challengesCompleted: 6 },
    { id: '9', username: 'focus_fanatic', challengesCompleted: 4 },
    { id: '10', username: 'image_hero', challengesCompleted: 3 },
  ];
  
  let allPhotos: Photo[] = [];
  const userPoints = new Map<string, number>();
  let idCounter = 1;
  
  for (const user of usersWithChallenges) {
    const { photos, totalPoints } = generateUserPhotos(user, idCounter);
    allPhotos = [...allPhotos, ...photos];
    userPoints.set(user.id, totalPoints);
    idCounter += user.challengesCompleted;
  }
  
  // Sort by timestamp (newest first)
  return { 
    photos: allPhotos.sort((a, b) => b.timestamp - a.timestamp),
    userPoints 
  };
};

const { photos: initialPhotos, userPoints: calculatedUserPoints } = generateAllPhotosAndUpdateUsers();

// Update initial users with calculated points
const updateUsersWithCalculatedPoints = (users: User[]): User[] => {
  return users.map(user => {
    const calculatedPoints = calculatedUserPoints.get(user.id);
    if (calculatedPoints !== undefined) {
      return { ...user, points: calculatedPoints };
    }
    return user;
  });
};

// In-memory storage (simulates backend database)
class DataStore {
  private users: User[] = updateUsersWithCalculatedPoints([...initialUsers]);
  private challenges: Challenge[] = [...initialChallenges];
  private photos: Photo[] = [...initialPhotos];

  // ============ USER METHODS ============
  
  getUsers(): User[] {
    return [...this.users].sort((a, b) => b.points - a.points);
  }

  getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  getCurrentUser(): User {
    return this.users.find(u => u.id === CURRENT_USER_ID) || this.users[0];
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates);
    }
    return user;
  }

  addPointsToUser(userId: string, points: number): User | undefined {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      user.points += points;
      user.challengesCompleted += 1;
    }
    return user;
  }

  // ============ CHALLENGE METHODS ============

  getChallenges(): Challenge[] {
    return [...this.challenges];
  }

  getChallenge(id: string): Challenge | undefined {
    return this.challenges.find(c => c.id === id);
  }

  getUserChallenges(userId: string): { completed: Challenge[]; uncompleted: Challenge[] } {
    const completed = this.challenges.filter(c => c.completedBy?.includes(userId));
    const uncompleted = this.challenges.filter(c => !c.completedBy?.includes(userId));
    return { completed, uncompleted };
  }

  completeChallenge(challengeId: string, userId: string): Challenge | undefined {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge) {
      if (!challenge.completedBy) {
        challenge.completedBy = [];
      }
      if (!challenge.completedBy.includes(userId)) {
        challenge.completedBy.push(userId);
      }
      // Mark as completed for current user specifically
      if (userId === CURRENT_USER_ID) {
        challenge.completed = true;
      }
    }
    return challenge;
  }

  // ============ PHOTO METHODS ============

  getPhotos(): Photo[] {
    return [...this.photos].sort((a, b) => b.timestamp - a.timestamp);
  }

  getPhotosByUser(userId: string): Photo[] {
    return this.photos
      .filter(p => p.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getPhotosByChallenge(challengeId: string): Photo[] {
    return this.photos
      .filter(p => p.challengeId === challengeId)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  addPhoto(photo: Omit<Photo, 'id'>): Photo {
    const newPhoto: Photo = {
      ...photo,
      id: Date.now().toString(),
    };
    this.photos.unshift(newPhoto);
    return newPhoto;
  }

  // ============ FEED METHODS ============

  getFeedPosts(): Post[] {
    // Convert photos to posts for feed display
    return this.photos
      .filter(p => p.verified)
      .map(photo => ({
        id: photo.id,
        username: photo.username,
        userId: photo.userId,
        challengeId: photo.challengeId,
        challengeDescription: photo.challengeTitle,
        challengePoints: photo.challengePoints,
        photoUri: photo.uri,
        timestamp: photo.timestamp,
        aspectRatio: photo.aspectRatio,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  // Legacy methods for backward compatibility
  getPosts(): Post[] {
    return this.getFeedPosts();
  }

  addPost(post: Omit<Post, 'id'> & { id?: string }): Post {
    const user = this.getUserByUsername(post.username);
    const newPhoto: Photo = {
      id: post.id || Date.now().toString(),
      userId: user?.id || CURRENT_USER_ID,
      username: post.username,
      uri: post.photoUri,
      challengeId: post.challengeId || '',
      challengeTitle: post.challengeDescription,
      challengePoints: post.challengePoints,
      timestamp: post.timestamp,
      aspectRatio: post.aspectRatio || 1,
      verified: true,
    };
    this.photos.unshift(newPhoto);
    return {
      ...post,
      id: newPhoto.id,
    } as Post;
  }
}

export const dataStore = new DataStore();
