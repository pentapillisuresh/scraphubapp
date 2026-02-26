// Send OTP via SmartPing SMS Gateway
export const sendSMS = async (mobile, otp) => {
  const message = encodeURIComponent(
    `Welcome to Scrap Express! Use ${otp} to verify your Scrap Express seller account and start selling your scrap today. SCPEXP`
  );

  const url = `https://pgapi.smartping.ai/fe/api/v1/send?username=scrapexpress.trans&password=xLyBc&unicode=false&from=SCPEXP&to=${mobile}&text=${message}&dltContentId=1707176916132647568`;
  try {
    const response = await fetch(url);

    return await response.text(); // SmartPing returns plain text
  } catch (error) {
    console.error("SMS sending failed:", error);
    throw error;
  }
};
