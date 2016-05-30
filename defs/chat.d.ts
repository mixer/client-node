export interface ChatPreferences {
  /**
   * Any preferences which contain ":" in the key name which TypeScript does not support as a valid type _yet_
   */
  [preference: string]: any;
}
