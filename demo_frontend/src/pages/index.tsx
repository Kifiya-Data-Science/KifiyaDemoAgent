// pages/index.tsx
import dynamic from 'next/dynamic';


// Dynamically import Graph with SSR disabled
const Graph = dynamic(() => import('../components/Graph'), { ssr: false });
const Chat = dynamic(() => import('../components/Chat'), { ssr: false });

const Home: React.FC = () => {
  return (
    <div className="app-container">
      <div className="graph-container">
        <Graph />
      </div>
      <div className="chat-wrapper">
        <Chat />
      </div>
    </div>
  );
};

export default Home;