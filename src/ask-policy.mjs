// Shared by the input and endpoint so a question is never silently shortened.
export const MAX_QUESTION_CHARS = 400;

export const askFailure = (reason) => {
  if (reason === 'no-material') return {
    message: "I couldn't safely match that to a reviewed answer or clearly relevant published work. Rather than guess, email is the faster route.",
    retryable: false,
  };
  if (reason === 'rate-limited') return {
    message: 'You’ve reached the Ask limit for now. Try again in an hour, choose a suggested question, or email Omar.',
    retryable: false,
  };
  if (reason === 'question-too-long') return {
    message: `Please shorten your question to ${MAX_QUESTION_CHARS} characters. Your text is still in the field.`,
    retryable: false,
  };
  if (reason === 'bad-request') return {
    message: 'Please check your question and submit it again.',
    retryable: false,
  };
  return {
    message: 'Ask couldn’t connect or finish the reply. Your question is still here. Try again, choose a suggested question, or email Omar.',
    retryable: true,
  };
};
