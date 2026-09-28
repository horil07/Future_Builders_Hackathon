const DEFAULT_PROFILE = {
  personal: {
    fullName: "", firstName: "", middleName: "", lastName: "", dob: "", gender: "",
    email: "", phone: "", alternatePhone: "", nationality: "", maritalStatus: ""
  },
  address: {
    line1: "", line2: "", city: "", district: "", state: "", country: "India", pincode: ""
  },
  identity: {
    category: "", disability: "", disabilityPercent: "", aadhaarLast4: "", pan: ""
  },
  education: {
    tenthSchool: "", tenthBoard: "", tenthYear: "", tenthPercent: "",
    twelfthSchool: "", twelfthBoard: "", twelfthYear: "", twelfthPercent: "",
    degree: "", branch: "", college: "", university: "", graduationYear: "", cgpa: "", percentage: ""
  },
  experience: {
    currentCompany: "", currentRole: "", totalYears: "", currentCtc: "", expectedCtc: "", noticePeriod: "",
    summary: ""
  },
  skills: [],
  links: { linkedin: "", github: "", portfolio: "" },
  preferences: { preferredLocations: "", workAuthorization: "", willingToRelocate: "" },
  documents: {}
};

chrome.runtime.onInstalled.addListener(async () => {
  const { profile } = await chrome.storage.local.get("profile");
  if (!profile) await chrome.storage.local.set({ profile: DEFAULT_PROFILE });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "GET_PROFILE") {
    chrome.storage.local.get("profile").then(({ profile }) => sendResponse({ profile: profile || DEFAULT_PROFILE }));
    return true;
  }
  if (message?.type === "SAVE_PROFILE") {
    chrome.storage.local.set({ profile: message.profile }).then(() => sendResponse({ ok: true }));
    return true;
  }
});
