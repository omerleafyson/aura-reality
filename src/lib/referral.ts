export const initReferral = () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref');
    if (refCode) {
      sessionStorage.setItem('referral_code', refCode);
    }
  }
};
