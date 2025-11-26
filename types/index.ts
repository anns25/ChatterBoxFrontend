export interface User {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    profilePicture?: string
  }
  
  export interface Message {
    _id?: string
    sender: string
    senderName?: string
    senderEmail?: string
    receiver?: string
    content: string
    timestamp?: Date | string
    createdAt?: Date | string
    chatId?: string
  }
  
  export interface Chat {
    _id: string
    participants: Array<{ 
      _id: string; 
      firstName: string; 
      lastName: string; 
      email: string;
      profilePicture?: string;
    }>
    lastMessage?: Message
    updatedAt: Date | string
    isGroupChat?: boolean
    groupName?: string
    groupPicture?: string
    admin?: {
      _id: string
      firstName: string
      lastName: string
      email: string
      profilePicture?: string
    }
  }