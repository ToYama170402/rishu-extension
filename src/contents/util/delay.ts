// 遅延関数
// 指定ミリ秒後に解決するPromiseを返す
export const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
