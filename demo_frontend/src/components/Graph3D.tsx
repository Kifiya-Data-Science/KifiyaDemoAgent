import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ForceGraph3D from '3d-force-graph';

// Define interfaces for the graph data structure
interface Node {
  id: string;
  group: number;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const colorPalette = [
  '#ef4444', // Level 1 Kifiya Tech Ecosystem
  '#3b82f6', // Level 2 (e.g., Credit Scoring)
  '#8b5cf6', // Level 3 (e.g., Platforms)
  '#6366f1', // Level 4 (e.g., Financial Platforms)
  '#f59e0b',
  '#14b8a6', // Level 6 (e.g., IFS)
  '#6366f1',  // Extra color if needed
  '#10b981', // Level 2 (e.g., Micro Formal)
  '#8b5cf6', // Level 4 (e.g., APLIQ)
];

const Graph: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);
  const isDraggingCamera = useRef(false);
  const isDraggingNode = useRef(false); // Track if a node is being dragged
  const lastMousePos = useRef({ x: 0, y: 0 });

  const graphData: GraphData = {
    nodes: [
      { id: "Credit Scoring", group: 2 },
      { id: "Micro Formal", group: 5 },
      { id: "Micro Informal", group: 5 },
      { id: "Inventory Finance", group: 5 },
      { id: "Invoice Finance", group: 5 },
      { id: "AgTech", group: 5 },
      { id: "Device and Asset Finance", group: 5 },
      { id: "Buy Now Pay Later", group: 5 },
      { id: "Platforms", group: 3 },
      { id: "APLIQ", group: 5 },
      { id: "ASCENT", group: 5 },
      { id: "COSAP", group: 5 },
      { id: "Agent Network", group: 5 },
      { id: "Decisioning SaaS", group: 5 },
      { id: "Early Warning System", group: 5 },
      { id: "Loan Portfolio Manager", group: 5 },
      { id: "Financial Platforms", group: 4 },
      { id: "IFS", group: 5 },
      { id: "IFS Sharia", group: 5 },
      { id: "Embedded Finance", group: 5 },
      { id: "Invoice Finance (RF and LPO)", group: 5 },
      { id: "Kifiya Tech Ecosystem", group: 1 },
    ],
    links: [
      { source: "Micro Formal", target: "Credit Scoring" },
      { source: "Micro Informal", target: "Credit Scoring" },
      { source: "Inventory Finance", target: "Credit Scoring" },
      { source: "Invoice Finance", target: "Credit Scoring" },
      { source: "AgTech", target: "Credit Scoring" },
      { source: "Device and Asset Finance", target: "Credit Scoring" },
      { source: "Buy Now Pay Later", target: "Credit Scoring" },
      { source: "APLIQ", target: "Platforms" },
      { source: "ASCENT", target: "Platforms" },
      { source: "COSAP", target: "Platforms" },
      { source: "Agent Network", target: "Platforms" },
      { source: "Decisioning SaaS", target: "Platforms" },
      { source: "Early Warning System", target: "Platforms" },
      { source: "Loan Portfolio Manager", target: "Platforms" },
      { source: "IFS", target: "Financial Platforms" },
      { source: "IFS Sharia", target: "Financial Platforms" },
      { source: "Embedded Finance", target: "Financial Platforms" },
      { source: "Invoice Finance (RF and LPO)", target: "Financial Platforms" },
      { source: "Platforms", target: "Kifiya Tech Ecosystem" },
      { source: "Credit Scoring", target: "Kifiya Tech Ecosystem" },
      { source: "Financial Platforms", target: "Kifiya Tech Ecosystem" },
    ]
  };

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const nodeColorMap: Record<string, string> = {};
    graphData.nodes.forEach((node) => {
      nodeColorMap[node.id] = colorPalette[(node.group - 1) % colorPalette.length];
    });

    const getNodeRadius = () => 8; // Uniform radius for all nodes

    const Graph3D = ForceGraph3D()(containerRef.current)
      .graphData(graphData)
      .backgroundColor('#f9fafb')
      .nodeThreeObject((node: any) => {
        const radius = getNodeRadius();
        const color = nodeColorMap[node.id] || '#ffffff';

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.5,
          metalness: 0.3
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Dynamic text canvas size based on label length
        const label = node.id;
        const baseFontSize = 120; // Base font size for scaling
        const textWidth = label.length * baseFontSize * 0.6; // Approximate width (0.6 is a char width factor)
        const textCanvasWidth = Math.max(64, Math.min(2048, textWidth)); // Clamp between 64 and 512
        const textCanvasHeight = textCanvasWidth / 2;

        const textCanvas = document.createElement('canvas');
        textCanvas.width = textCanvasWidth;
        textCanvas.height = textCanvasHeight;
        const textCtx = textCanvas.getContext('2d');
        if (textCtx) {
          textCtx.fillStyle = 'transparent';
          textCtx.fillRect(0, 0, textCanvasWidth, textCanvasHeight);
          textCtx.fillStyle = '#111827';
          textCtx.font = `${baseFontSize}px bold sans-serif`; // Fixed font size for consistency
          textCtx.textAlign = 'center';
          textCtx.textBaseline = 'middle';
          textCtx.fillText(label, textCanvasWidth / 2, textCanvasHeight / 2);
        }
        const textTexture = new THREE.CanvasTexture(textCanvas);
        const textMaterial = new THREE.SpriteMaterial({ map: textTexture });
        const textSprite = new THREE.Sprite(textMaterial);
        textSprite.scale.set(textCanvasWidth / 20, textCanvasHeight / 20, 1); // Scale proportionally
        mesh.add(textSprite);

        mesh.userData.textSprite = textSprite;
        mesh.userData.radius = radius;

        return mesh;
      })
      .nodeThreeObjectExtend(true)
      .linkWidth(3)
      .linkColor(() => '#999')
      .onNodeClick((node: any) => {
        window.dispatchEvent(new CustomEvent('nodeClicked', { detail: node.id }));
      })
      .onNodeDrag(() => {
        isDraggingNode.current = true; // Set flag when a node drag starts
      })
      .onNodeDragEnd(() => {
        isDraggingNode.current = false; // Clear flag when node drag ends
      })
      .onEngineTick(() => {
        const camera = Graph3D.camera();
        Graph3D.scene().traverse((obj: any) => {
          if (obj.userData.textSprite) {
            const textSprite = obj.userData.textSprite;
            const radius = obj.userData.radius;

            const nodeWorldPos = new THREE.Vector3();
            obj.getWorldPosition(nodeWorldPos);
            
            const cameraPos = new THREE.Vector3();
            camera.getWorldPosition(cameraPos);

            const direction = new THREE.Vector3()
              .subVectors(cameraPos, nodeWorldPos)
              .normalize();

            textSprite.quaternion.copy(camera.quaternion);

            const textPosition = new THREE.Vector3(0, -radius * 1.5, 0);
            textSprite.position.copy(textPosition);
          }
        });
      });

    graphRef.current = Graph3D;

    Graph3D.enableNodeDrag(true);
    Graph3D.enableNavigationControls(true);

    // Adjust camera position to center at 45% from the top
    const containerHeight = containerRef.current.clientHeight || 600; // Default to 600px if not available
    const zDistance = 300; // Maintain original z-depth
    const yOffset = containerHeight * (0.5 - 0.45); // 0.5 is center, 0.45 is 45% from top
    Graph3D.cameraPosition({ x: 0, y: yOffset, z: zDistance });
    Graph3D.camera().lookAt(new THREE.Vector3(0, 0, 0)); // Ensure camera looks at graph center

    // Add camera dragging functionality
    const onMouseDown = (event: MouseEvent) => {
      // Only enable camera dragging if Shift key is held and no node is being dragged
      if (event.shiftKey && !isDraggingNode.current) {
        isDraggingCamera.current = true;
        lastMousePos.current = { x: event.clientX, y: event.clientY };
      }
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isDraggingCamera.current) return;

      const deltaX = event.clientX - lastMousePos.current.x;
      const deltaY = event.clientY - lastMousePos.current.y;

      const camera = Graph3D.camera();
      const cameraPos = camera.position;

      // Adjust sensitivity for dragging
      const sensitivity = 0.5;
      const newX = cameraPos.x - deltaX * sensitivity;
      const newY = cameraPos.y + deltaY * sensitivity; // Invert Y to match typical drag behavior

      Graph3D.cameraPosition({ x: newX, y: newY, z: cameraPos.z });
      Graph3D.camera().lookAt(new THREE.Vector3(0, 0, 0)); // Keep looking at the graph center

      lastMousePos.current = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDraggingCamera.current = false;
    };

    // Attach event listeners to the container
    const container = containerRef.current;
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp); // Stop dragging if mouse leaves container

    return () => {
      if (graphRef.current && graphRef.current._destructor) {
        graphRef.current._destructor();
      }
      // Clean up event listeners
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
    };
  }, []);

  return (
    <div className="flex-1 flex justify-center items-start overflow-hidden">
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default Graph;