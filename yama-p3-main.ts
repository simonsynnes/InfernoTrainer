/**
 * Yama Phase 3 Simulator Main Entry Point
 * 
 * This file initializes and starts the Yama P3 simulation.
 * Run this to launch the simulator.
 */

import { YamaP3Simulator } from './src/yama-p3/simulator/YamaP3Simulator';
import { Assets } from './src/sdk/utils/Assets';
import { Settings } from './src/sdk/Settings';
import { ImageLoader } from './src/sdk/utils/ImageLoader';
import { MapController } from './src/sdk/MapController';
import { ControlPanelController } from './src/sdk/ControlPanelController';
import { Chrome } from './src/sdk/Chrome';
import { Viewport } from './src/sdk/Viewport';
import * as THREE from 'three';

// Initialize settings
Settings.readFromStorage();
Settings._tileSize = 23; // Default tile size
Settings.use3dView = true; // Use 3D view

// Initialize the simulator
const simulator = new YamaP3Simulator();

// Start the simulation once assets are loaded
async function startSimulation() {
    try {
        console.log('Loading assets for Yama P3 Simulator...');
        
        // Initialize controllers
        
        // Wait for all images to load
        await new Promise<void>((resolve) => {
            ImageLoader.onAllImagesLoaded(() => {
                console.log('All images loaded');
                resolve();
            });
            
            // Check images every 50ms
            const interval = setInterval(() => {
                ImageLoader.checkImagesLoaded(interval);
            }, 50);
        });
        
        console.log('Assets loaded. Initializing simulator...');
        
        // Set up canvas size
        const canvas = document.getElementById('world') as HTMLCanvasElement;
        if (canvas) {
            const { width, height } = Chrome.size();
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
        }
        
        simulator.initialize();
        
        // Initialize MapController UI elements
        const player = simulator.getPlayer();
        if (player) {
            MapController.controller.updateOrbsMask(player.currentStats, player.stats);
        }
        
        console.log('Starting Yama P3 Simulator...');
        simulator.start();
        
        // Give the 3D view time to initialize, then ensure proper camera position
        setTimeout(() => {
            const player = simulator.getPlayer();
            const arena = simulator.getArena();
            const yama = arena.getYama();
            
            if (player && arena) {
                console.log('3D view initialized:');
                console.log('Player location:', player.location);
                console.log('Yama location:', yama ? yama.location : 'not found');
                console.log('Arena dimensions:', arena.width, 'x', arena.height);
                
                // Ensure entities are properly positioned
                if (yama) {
                    console.log('Yama size:', yama.size);
                    console.log('Yama color:', yama.color);
                    console.log('Yama 3D model:', yama.get3dModel());
                    
                    // Check if the Verzik model URL is accessible
                    const yamaModelUrl = 'https://assets-soltrainer.netlify.app/models/verzik.glb';
                    console.log('Testing Yama model URL:', yamaModelUrl);
                    
                    fetch(yamaModelUrl, { method: 'HEAD' })
                        .then(response => {
                            console.log('Yama model URL status:', response.status, response.statusText);
                            if (!response.ok) {
                                console.error('Yama model not accessible - this explains the black model');
                            }
                        })
                        .catch(error => {
                            console.error('Failed to reach Yama model URL:', error);
                        });
                }
                
                // Check 3D scene setup
                if (Viewport.viewport) {
                    const viewport = Viewport.viewport as any;
                    if (viewport.delegate && viewport.delegate.scene) {
                        console.log('3D Scene objects:', viewport.delegate.scene.children.length);
                        console.log('Camera position:', viewport.delegate.camera?.position);
                        
                        // Log all scene children for debugging
                        viewport.delegate.scene.children.forEach((child: any, index: number) => {
                            console.log(`Scene child ${index}:`, {
                                type: child.type,
                                name: child.name,
                                position: child.position,
                                visible: child.visible,
                                material: child.material?.map ? 'has texture' : 'no texture',
                                userData: child.userData
                            });
                            
                            // If this is a model, try to make it more visible
                            if (child.type === 'Object3D' && child.children?.length > 0) {
                                child.traverse((meshChild: any) => {
                                    if (meshChild.isMesh && meshChild.material) {
                                        // Increase material brightness
                                        if (meshChild.material.emissive) {
                                            meshChild.material.emissive.setHex(0x222222);
                                        }
                                        if (meshChild.material.color) {
                                            meshChild.material.color.multiplyScalar(1.5);
                                        }
                                        meshChild.material.needsUpdate = true;
                                        console.log('Enhanced material for mesh:', meshChild.name);
                                    }
                                });
                            }
                        });
                        
                        // Set a background color for the scene
                        viewport.delegate.scene.background = new THREE.Color(0x1a1a1a); // Dark background
                        
                        // Fix floor plane positioning to ensure it's perfectly horizontal
                        const floorPlane = viewport.delegate.scene.children.find((child: any) => 
                            child.userData && child.userData.isFloor
                        );
                        if (floorPlane) {
                            console.log('Found floor plane, fixing position');
                            // Reset the floor plane to be perfectly horizontal
                            floorPlane.rotation.set(-Math.PI / 2, 0, 0); // Horizontal
                            floorPlane.position.set(arena.width / 2, -0.5, -arena.height / 2); // Centered and at ground level
                            console.log('Floor plane position corrected:', floorPlane.position);
                        }
                        
                        // Add additional lighting to make models more visible
                        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                        directionalLight.position.set(10, 20, 10);
                        directionalLight.castShadow = false;
                        viewport.delegate.scene.add(directionalLight);
                        
                        // Add point light at arena center for better model illumination
                        const pointLight = new THREE.PointLight(0xffffff, 1.0, 30);
                        pointLight.position.set(15, 5, 15);
                        viewport.delegate.scene.add(pointLight);
                        
                        // Try to manually position camera for debugging
                        if (viewport.delegate.camera) {
                            const cam = viewport.delegate.camera;
                            console.log('Original camera position:', cam.position);
                            // Move camera to a good viewing position above and away from center
                            // Make the view more horizontal/level
                            cam.position.set(15, 4, 18); // Lower height for more level view
                            cam.lookAt(15, -0.5, 15); // Look at ground level at arena center
                            console.log('Adjusted camera position:', cam.position);
                        }
                    }
                }
            }
        }, 1000);
        
        // Set up global references for debugging
        (window as any).yamaP3Simulator = simulator;
        (window as any).yamaArena = simulator.getArena();
        (window as any).player = simulator.getPlayer();
        (window as any).yama = simulator.getArena().getYama();
        
        // Add debugging functions
        (window as any).debugCamera = () => {
            const viewport = Viewport.viewport as any;
            if (viewport?.delegate?.camera) {
                const cam = viewport.delegate.camera;
                console.log('Camera position:', cam.position);
                console.log('Camera rotation:', cam.rotation);
                return cam;
            }
        };
        
        (window as any).moveCamera = (x: number, y: number, z: number) => {
            const viewport = Viewport.viewport as any;
            if (viewport?.delegate?.camera) {
                const cam = viewport.delegate.camera;
                cam.position.set(x, y, z);
                cam.lookAt(15, 0, 15); // Look at arena center
                console.log('Camera moved to:', cam.position);
            }
        };
        
        (window as any).listSceneObjects = () => {
            const viewport = Viewport.viewport as any;
            if (viewport?.delegate?.scene) {
                const scene = viewport.delegate.scene;
                console.log('Scene children count:', scene.children.length);
                scene.children.forEach((child: any, index: number) => {
                    console.log(`Object ${index}:`, child.type, child.position, child.visible);
                });
                return scene.children;
            }
        };
        
        console.log('Yama P3 Simulator ready! Use browser console to interact with:');
        console.log('- yamaP3Simulator: Main simulator instance');
        console.log('- yamaArena: The arena region');
        console.log('- player: The player character');
        console.log('- yama: The Yama P3 boss');
        
    } catch (error) {
        console.error('Failed to start Yama P3 Simulator:', error);
    }
}

// Start when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startSimulation);
} else {
    startSimulation();
}

export { simulator as yamaP3Simulator };