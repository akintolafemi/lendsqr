export const GenerateWalletNumber = () => {
  const min = 1000000000; // Minimum 10-digit number (1 followed by 9 zeros)
  const max = 9999999999; // Maximum 10-digit number (9 nines)

  // Generate a random number between min and max (inclusive)
  const walletNumber = Math.floor(Math.random() * (max - min + 1)) + min;

  // Convert the number to a string and return it
  return walletNumber.toString();
};

export const GenerateRef = (length: number) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};
