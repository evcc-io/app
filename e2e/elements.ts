export const MainScreen = {} as const;

export const Webview = {
  changeServerButton: web.element(by.web.id("topNavigatonDropdown")),
};

export const SettingsScreen = {} as const;

export const ServerScreen = {
  manualEntryButton: element(by.id("manualEntry")),
  useDemoButton: element(by.id("useDemo")),
  serverSearchButton: element(by.id("serverSearchButton")),
  serverSearchItem: (index: number) =>
    element(by.id("serverSearchListItem" + index)),
  serverSearchItemButton: (index: number) =>
    element(by.id("serverSearchListItem" + index + "Button")),
} as const;

export const ServerManualScreen = {
  urlInput: element(by.id("@serverFormUrl/input")),
  checkboxInput: element(by.id("serverFormAuth")),
  userInput: element(by.id("@serverFormAuthUser/input")),
  passwordInput: element(by.id("@serverFormAuthPassword/input")),
  saveButton: element(by.id("serverFormCheckAndSave")),
} as const;
