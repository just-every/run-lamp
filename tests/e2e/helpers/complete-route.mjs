// A pending route can outlive its page or another handler can finish it.
export async function completeRoute(action) {
  try {
    await action();
  } catch (error) {
    if (!(error instanceof Error) ||
        !/Route is already handled\b|(?:page|context|browser) has been closed\b/i.test(error.message)) {
      throw error;
    }
  }
}
