// This module will handle rendering the 3D force graph using 3d-force-graph
// and switching between 2D and 3D views.
import * as THREE from 'three';
import ForceGraph3D, { ForceGraph3DInstance } from '3d-force-graph';

export class Graph3DVisualization {
  private container: HTMLElement;
  private graphData: any;
  private graph3D: ForceGraph3DInstance | null = null;

  constructor(container: HTMLElement, graphData: any) {
    this.container = container;
    this.graphData = this.normalizeGraphData(graphData);
  }

  private normalizeGraphData(data: any) {
    // Ensure nodes and links are always arrays
    return {
      ...data,
      nodes: Array.isArray(data?.nodes) ? data.nodes : [],
      links: Array.isArray(data?.links) ? data.links : [],
    };
  }

  render(onNodeClick?: (node: any) => void) {
    // Always normalize before rendering in case data changes
    this.graphData = this.normalizeGraphData(this.graphData);
    const nodeClickHandler = onNodeClick || ((node: any) => {
      // Highlight 1-jump and 2-jump neighbors
      const graphDataProvider = (window as any).graphDataProvider;
      if (graphDataProvider) {
        const neighbors1 = graphDataProvider.getNeighbors(node.id, 1);
        const neighbors2 = graphDataProvider.getNeighbors(node.id, 2);
        this.highlightSelection(node.id, neighbors1, neighbors2);
      }
      // Show node info panel (use correct IDs)
      const panel = document.getElementById('graph-info-panel');
      const content = document.getElementById('graph-info-content');
      const titleElem = document.getElementById('graph-info-title');
      if (panel && content && titleElem) {
        titleElem.textContent = node.profile?.displayName || node.label || node.name || node.id;
        content.innerHTML = `
          <div class="node-info-panel-body">
            <div style="text-align:center;"></div>
            <div class="node-info-quick-actions" style="margin: 16px 0; display: flex; gap: 10px; justify-content: center;">
              <button class="quick-action-btn" id="zoom-to-node-btn" title="Zoom to node">🔍 Zoom to</button>
              <button class="quick-action-btn" id="highlight-neighbors-btn" title="Highlight neighbors">🌐 Highlight neighbors</button>
            </div>
            <div class="node-info-details">
              <div><b>Type:</b> ${node.type || ''}</div>
              <div><b>Group:</b> ${node.group || ''}</div>
              <div><b>Role:</b> ${node.role || ''}</div>
              <div><b>ID:</b> ${node.id}</div>
              <div><b>NameID:</b> ${node.nameID || ''}</div>
              <div><b>Weight:</b> ${node.weight || ''}</div>
              <div><b>Profile URL:</b> ${node.profile?.url ? `<a href='${node.profile.url}' target='_blank'>${node.profile.url}</a>` : ''}</div>
              <div><b>Location:</b> ${node.profile?.location?.city || ''}, ${node.profile?.location?.country || ''}</div>
              <div><b>Lat/Lon:</b> ${node.profile?.location?.lat || ''}, ${node.profile?.location?.lon || ''}</div>
            </div>
          </div>
        `;
        panel.classList.add('visible');
        panel.style.display = 'flex';
        // Attach button handlers after rendering content
        const zoomBtn = document.getElementById('zoom-to-node-btn');
        if (zoomBtn) zoomBtn.onclick = () => {
          if (this.graph3D && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
            this.graph3D.cameraPosition(
              { x: node.x, y: node.y, z: node.z + 200 },
              { x: node.x, y: node.y, z: node.z },
              1000
            );
          }
        };
        const highlightBtn = document.getElementById('highlight-neighbors-btn');
        if (highlightBtn) highlightBtn.onclick = () => {
          if (graphDataProvider) {
            const neighbors1 = graphDataProvider.getNeighbors(node.id, 1);
            const neighbors2 = graphDataProvider.getNeighbors(node.id, 2);
            this.highlightSelection(node.id, neighbors1, neighbors2);
            // Add a short pulse effect to highlighted nodes for visual feedback (Three.js Mesh)
            if (this.graph3D && typeof window !== 'undefined') {
              import('three').then(THREE => {
                if (!this.graph3D) return;
                this.graph3D.nodeThreeObject((n: any) => {
                  if (n.id === node.id || neighbors1.has(n.id) || neighbors2.has(n.id)) {
                    const geometry = new THREE.SphereGeometry(12, 16, 16);
                    const material = new THREE.MeshBasicMaterial({ color: 0xFFD600, transparent: true, opacity: 0.25 });
                    const mesh = new THREE.Mesh(geometry, material);
                    setTimeout(() => {
                      if (mesh.parent) mesh.parent.remove(mesh);
                    }, 600);
                    return mesh;
                  }
                  return new THREE.Object3D();
                });
                setTimeout(() => {
                  if (this.graph3D) this.graph3D.nodeThreeObject(() => new THREE.Object3D());
                }, 700);
              });
            }
          }
        };
        const closeBtn = document.getElementById('graph-info-close');
        if (closeBtn) closeBtn.onclick = () => panel.classList.remove('visible');
      }
    });
    if (!this.graph3D) {
      this.graph3D = new (ForceGraph3D as any)()(this.container)
        .graphData(this.graphData)
        .nodeAutoColorBy('group')
        .linkDirectionalParticles(2)
        .linkDirectionalParticleWidth(2)
        .onNodeClick(nodeClickHandler);
    } else {
      this.graph3D.graphData(this.graphData);
      this.graph3D.onNodeClick(nodeClickHandler);
    }
  }

  public highlightSelection(nodeId: string, neighbors1: Set<string>, neighbors2: Set<string>) {
    if (!this.graph3D) return;
    this.graph3D
      .nodeColor((n: any) =>
        n.id === nodeId ? '#0A6E8A' : neighbors1.has(n.id) ? '#8BDDC4' : neighbors2.has(n.id) ? '#FFD600' : '#bfc9d1')
      .linkColor((l: any) =>
        neighbors1.has(l.source.id) && neighbors1.has(l.target.id) ? '#8BDDC4' : '#ccc');
  }

  // Add public zoom methods for fullscreen controls
  public zoomIn() {
    if (this.graph3D) {
      const cam = this.graph3D.camera();
      cam.position.z *= 0.8;
      this.graph3D.cameraPosition({ z: cam.position.z });
    }
  }
  public zoomOut() {
    if (this.graph3D) {
      const cam = this.graph3D.camera();
      cam.position.z *= 1.2;
      this.graph3D.cameraPosition({ z: cam.position.z });
    }
  }
  public zoomToFit(duration = 800) {
    if (this.graph3D) {
      this.graph3D.zoomToFit(duration);
    }
  }

  public resize(width: number, height: number) {
    if (this.graph3D) {
      this.graph3D.width(width).height(height);
    }
  }

  destroy() {
    if (this.graph3D) {
      // @ts-ignore: _destructor is not in types but is present
      this.graph3D._destructor?.();
      this.graph3D = null;
    }
  }
}
