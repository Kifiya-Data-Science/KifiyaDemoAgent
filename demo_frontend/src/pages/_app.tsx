import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/Chat.css'; // Import the separate CSS file
function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp; 