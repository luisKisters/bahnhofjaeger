const ONBOARDED_KEY = "bahnhofjaeger:onboarded";

export function readOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, "1");
  } catch {
    // storage blocked: the user gets the landing page again next visit
  }
}
