export interface IChatPreferences {
  "channel:mature:allowed": boolean;
  "channel:notifications": {
    id: number[];
    transports: string[];
  }
  "channel:player:forceflash": boolean;
  "chat:chromakey": boolean;
  "chat:colors": boolean;
  "chat:lurkmode": boolean;
  "chat:sounds:html5": boolean;
  "chat:sounds:play": boolean;
  "chat:sounds:volume": number;
  "chat:tagging": boolean;
  "chat:timestamps": boolean;
  "chat:whispers": boolean;
}