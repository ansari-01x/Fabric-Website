/* ==========================================================================
   URWA STYLES - Premium 3D & GSAP Interaction Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initNavbar();
    initHero3D();
    initCustomizer3D();
    initScrollAnimations();
    initContactForm();
});

/* ==========================================================================
   Custom Cursor Logic
   ========================================================================== */
function initCursor() {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth cursor follow
    function animateCursor() {
        let dx = mouseX - cursorX;
        let dy = mouseY - cursorY;
        
        cursorX += dx * 0.15;
        cursorY += dy * 0.15;

        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
        requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover expansions
    const hoverElements = document.querySelectorAll('a, button, .color-btn, .option-btn, .collection-card-3d, .form-group input, .form-group select, .form-group textarea');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovered');
            if (el.classList.contains('collection-card-3d') || el.closest('#fabric-stage')) {
                cursor.querySelector('.cursor-text').textContent = 'DRAG';
            } else {
                cursor.querySelector('.cursor-text').textContent = 'VIEW';
            }
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovered');
        });
    });
}

/* ==========================================================================
   Navbar & Navigation Logic
   ========================================================================== */
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Active link highlighting on scroll
        let current = '';
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
        });

        // Close menu on link click
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.classList.remove('active');
            });
        });
    }
}

/* ==========================================================================
   Hero 3D Fabric Simulation (Three.js)
   ========================================================================== */
function initHero3D() {
    const container = document.getElementById('hero-canvas-container');
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.z = 15;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    // Gold Directional Light (Top Left)
    const goldLight = new THREE.DirectionalLight(0xD4AF37, 1.8);
    goldLight.position.set(-10, 10, 10);
    scene.add(goldLight);

    // Emerald Directional Light (Bottom Right)
    const emeraldLight = new THREE.DirectionalLight(0x0A3A2F, 2.2);
    emeraldLight.position.set(10, -10, 5);
    scene.add(emeraldLight);

    // Soft White fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(0, 0, 10);
    scene.add(fillLight);

    // 5. Plane Geometry & Material representing silk drape
    // Grid size 35x25 with 60x40 segments for smooth waves
    const geometry = new THREE.PlaneGeometry(28, 18, 50, 35);
    
    // Create a physical material that responds beautifully to lighting with custom silk parameters
    const material = new THREE.MeshStandardMaterial({
        color: 0x051C16,       // Base Deep Emerald
        roughness: 0.28,       // Shiny silk sheen
        metalness: 0.6,        // Metallic tilla threads integration
        side: THREE.DoubleSide,
        flatShading: false
    });

    const fabricMesh = new THREE.Mesh(geometry, material);
    scene.add(fabricMesh);

    // Store original positions for waves deformation
    const positions = geometry.attributes.position;
    const initialZ = new Float32Array(positions.count);
    const initialX = new Float32Array(positions.count);
    const initialY = new Float32Array(positions.count);

    for (let i = 0; i < positions.count; i++) {
        initialZ[i] = positions.getZ(i);
        initialX[i] = positions.getX(i);
        initialY[i] = positions.getY(i);
    }

    // 6. Interactive Raycasting & Mouse Movement
    let mouse = new THREE.Vector2();
    let targetMouse = new THREE.Vector2();
    let raycaster = new THREE.Raycaster();
    let intersects = [];
    let intersectPoint = new THREE.Vector3(0, 0, 0);
    let isMouseOnMesh = false;

    window.addEventListener('mousemove', (e) => {
        // Calculate normalized device coordinates
        targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Clock for wave velocity
    const clock = new THREE.Clock();

    // 7. Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();

        // Smooth mouse coords interpolation
        mouse.x += (targetMouse.x - mouse.x) * 0.1;
        mouse.y += (targetMouse.y - mouse.y) * 0.1;

        // Perform Raycasting to see if mouse points at fabric
        raycaster.setFromCamera(mouse, camera);
        intersects = raycaster.intersectObject(fabricMesh);
        if (intersects.length > 0) {
            intersectPoint.copy(intersects[0].point);
            isMouseOnMesh = true;
        } else {
            isMouseOnMesh = false;
        }

        // Deform vertices to simulate silk waving in the wind + interactive ripples
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = initialX[i];
            const y = initialY[i];

            // 3-way wave synthesis: combination of sine/cosine frequencies
            let waveZ = Math.sin(x * 0.25 + time * 1.2) * Math.cos(y * 0.2 + time * 1.0) * 1.1;
            waveZ += Math.sin(y * 0.4 - time * 1.5) * 0.3; // Micro-folds
            waveZ += Math.cos(x * 0.15 + time * 0.6) * 0.5; // Large drapes

            // Localized mouse displacement
            if (isMouseOnMesh) {
                // Calculate distance between vertex and raycast intersection point
                const vx = posAttr.getX(i);
                const vy = posAttr.getY(i);
                const dx = vx - intersectPoint.x;
                const dy = vy - intersectPoint.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 4.5) {
                    // Push vertex forward / create a ripple pulse decaying with distance
                    const force = (4.5 - dist) * 0.35;
                    const ripple = Math.sin(dist * 3.0 - time * 8.0) * force;
                    waveZ += ripple + force * 0.5;
                }
            }

            posAttr.setZ(i, waveZ);
        }
        
        posAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        // Gently tilt the entire fabric mesh with the mouse
        fabricMesh.rotation.y = mouse.x * 0.08;
        fabricMesh.rotation.x = -mouse.y * 0.05;

        renderer.render(scene, camera);
    }
    animate();

    // 8. Handle Window resizing
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/* ==========================================================================
   Interactive 3D Swatch Customizer (Three.js)
   ========================================================================== */
function initCustomizer3D() {
    const container = document.getElementById('fabric-stage');
    const loader = document.getElementById('customizer-loader');
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 11);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Hide loader once canvas is appended
    setTimeout(() => {
        if (loader) loader.style.opacity = '0';
        setTimeout(() => { if (loader) loader.style.display = 'none'; }, 500);
    }, 800);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
    light1.position.set(5, 5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xD4AF37, 1.0); // Gold ambient light highlight
    light2.position.set(-5, -5, 2);
    scene.add(light2);

    // 5. Creating a "Draped Hanging Cloth Swatch"
    // We construct a wavy parametric surface or deformed plane geometry
    const geometry = new THREE.PlaneGeometry(6, 7.5, 40, 40);
    
    // Load local texture maps to simulate embroidery details
    const textureLoader = new THREE.TextureLoader();
    
    // We will use standard color rendering + normal maps generated from basic mathematical functions,
    // or simple loaded textures if needed.
    const material = new THREE.MeshStandardMaterial({
        color: 0x0A3A2F, // Starts with Royal Emerald Green
        roughness: 0.2,
        metalness: 0.75,
        side: THREE.DoubleSide,
        bumpScale: 0.05,
    });

    const drapeMesh = new THREE.Mesh(geometry, material);
    drapeMesh.position.y = 0.2;
    scene.add(drapeMesh);

    // Store original vertices
    const positions = geometry.attributes.position;
    const initialX = new Float32Array(positions.count);
    const initialY = new Float32Array(positions.count);
    const initialZ = new Float32Array(positions.count);

    for (let i = 0; i < positions.count; i++) {
        initialX[i] = positions.getX(i);
        initialY[i] = positions.getY(i);
        initialZ[i] = positions.getZ(i);
    }

    // 6. Interactive Drag to Rotate (Manual Orbit Controls)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0.2;
    let targetRotationY = 0;
    let waveSpeedScale = 1.0;

    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const deltaMove = {
            x: e.clientX - previousMousePosition.x,
            y: e.clientY - previousMousePosition.y
        };

        targetRotationY += deltaMove.x * 0.007;
        targetRotationX += deltaMove.y * 0.007;

        // Limit vertical rotation to prevent full flip
        targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));

        previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch support for mobiles
    container.addEventListener('touchstart', (e) => {
        if(e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;

        const deltaMove = {
            x: e.touches[0].clientX - previousMousePosition.x,
            y: e.touches[0].clientY - previousMousePosition.y
        };

        targetRotationY += deltaMove.x * 0.007;
        targetRotationX += deltaMove.y * 0.007;
        targetRotationX = Math.max(-0.6, Math.min(0.6, targetRotationX));

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    // 7. Animation Loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);

        const time = clock.getElapsedTime();

        // Smooth mesh rotation interpolation
        drapeMesh.rotation.y += (targetRotationY - drapeMesh.rotation.y) * 0.1;
        drapeMesh.rotation.x += (targetRotationX - drapeMesh.rotation.x) * 0.1;

        // Vertex wave deformation representing fabric drape and folds
        const posAttr = geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
            const x = initialX[i];
            const y = initialY[i];

            // Wavy folds draping downwards
            let zVal = Math.sin(x * 1.2 + time * 1.5 * waveSpeedScale) * 0.3 * (y - 3.75) / 7.5;
            // Hanging fold curvature
            zVal += Math.cos(x * 0.5) * 0.15;
            
            // Ripple wave based on speed
            if (waveSpeedScale > 0) {
                zVal += Math.sin(y * 1.5 + time * 2.0 * waveSpeedScale) * 0.1;
            }

            posAttr.setZ(i, zVal);
        }
        posAttr.needsUpdate = true;
        geometry.computeVertexNormals();

        renderer.render(scene, camera);
    }
    animate();

    // 8. Customizer UI Selectors Logic
    const textureButtons = document.querySelectorAll('.texture-selector .option-btn');
    const colorButtons = document.querySelectorAll('.color-selector .color-btn');
    const speedButtons = document.querySelectorAll('.drape-selector .drape-btn');
    
    const summaryFabric = document.getElementById('summary-fabric-name');
    const summaryColor = document.getElementById('summary-color-name');
    const summaryDesc = document.getElementById('summary-fabric-desc');

    let currentTexture = 'silk';
    let currentColorName = 'Emerald Green';

    // Texture settings
    const texturePresets = {
        silk: { roughness: 0.2, metalness: 0.75, name: 'Royal Silk' },
        lawn: { roughness: 0.85, metalness: 0.05, name: 'Lawn Cotton' },
        organza: { roughness: 0.45, metalness: 0.15, name: 'Sheer Organza' },
        velvet: { roughness: 0.78, metalness: 0.0, name: 'Royal Velvet' }
    };

    // 8a. Handle Texture Switches
    textureButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            textureButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const presetKey = btn.getAttribute('data-texture');
            currentTexture = presetKey;
            const preset = texturePresets[presetKey];
            const desc = btn.getAttribute('data-desc');

            // Apply Three.js material parameter updates
            gsap.to(material, {
                roughness: preset.roughness,
                metalness: preset.metalness,
                duration: 0.5
            });

            // Specific transparency updates for organza
            if (presetKey === 'organza') {
                material.transparent = true;
                gsap.to(material, { opacity: 0.75, duration: 0.5 });
            } else {
                gsap.to(material, {
                    opacity: 1.0,
                    duration: 0.5,
                    onComplete: () => { material.transparent = false; }
                });
            }

            // Update details
            if (summaryFabric) summaryFabric.textContent = preset.name;
            if (summaryDesc) summaryDesc.textContent = desc;
        });
    });

    // 8b. Handle Color Switches
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            colorButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const colorHex = btn.getAttribute('data-color');
            const colorName = btn.getAttribute('data-name');
            currentColorName = colorName;

            // Interpolate color change using GSAP for rich transition
            const threeColor = new THREE.Color(colorHex);
            gsap.to(material.color, {
                r: threeColor.r,
                g: threeColor.g,
                b: threeColor.b,
                duration: 0.6,
                ease: 'power2.out'
            });

            if (summaryColor) summaryColor.textContent = colorName;
        });
    });

    // 8c. Handle Speed Switches
    speedButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            speedButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const speed = parseFloat(btn.getAttribute('data-speed'));
            
            // Animate speed transition
            gsap.to({ val: waveSpeedScale }, {
                val: speed,
                duration: 0.8,
                onUpdate: function() {
                    waveSpeedScale = this.targets()[0].val;
                }
            });
        });
    });

    // 8d. Handle Customizer Order Action
    const customizerOrderBtn = document.getElementById('customizer-order-btn');
    if (customizerOrderBtn) {
        customizerOrderBtn.addEventListener('click', () => {
            const fabricTextName = texturePresets[currentTexture].name;
            const message = `Hi Urwa Styles! I am exploring your website and just customized a design in the 3D Customizer. I love the ${fabricTextName} fabric in the ${currentColorName} shade. Can you let me know the pricing, availability, and delivery details in Lahore?`;
            const waUrl = `https://wa.me/923001234567?text=${encodeURIComponent(message)}`;
            window.open(waUrl, '_blank');
        });
    }

    // Resize listener
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

/* ==========================================================================
   GSAP ScrollTrigger Reveal Animations
   ========================================================================== */
function initScrollAnimations() {
    // Register scroll trigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // 1. Hero Text Reveal Animations
    const heroTimeline = gsap.timeline();
    
    heroTimeline.fromTo('#hero-brand-animate', 
        { opacity: 0, y: 50 }, 
        { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out' }
    );
    heroTimeline.fromTo('#hero-tag-animate', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.8'
    );
    heroTimeline.fromTo('#hero-desc-animate', 
        { opacity: 0, y: 25 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
        '-=0.6'
    );
    heroTimeline.fromTo('#hero-cta-animate', 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' },
        '-=0.5'
    );
    heroTimeline.fromTo('.scroll-indicator', 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 },
        '-=0.2'
    );

    // 2. Heritage Section reveals
    gsap.from('#heritage .section-subtitle, #heritage .section-title, #heritage .title-divider', {
        scrollTrigger: {
            trigger: '#heritage',
            start: 'top 80%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out'
    });

    gsap.from('#heritage .heritage-paragraph', {
        scrollTrigger: {
            trigger: '#heritage',
            start: 'top 75%',
            toggleActions: 'play none none none'
        },
        opacity: 0,
        y: 30,
        duration: 0.8,
        stagger: 0.2,
        ease: 'power3.out'
    });

    gsap.from('.stat-item', {
        scrollTrigger: {
            trigger: '.heritage-stats',
            start: 'top 85%'
        },
        opacity: 0,
        y: 20,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out'
    });

    // Parallax scroll for heritage visual
    gsap.to('#heritage-main-img img', {
        scrollTrigger: {
            trigger: '#heritage',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        },
        yPercent: -15
    });

    gsap.to('#heritage-sub-img img', {
        scrollTrigger: {
            trigger: '#heritage',
            start: 'top bottom',
            end: 'bottom top',
            scrub: true
        },
        yPercent: 10
    });

    // 3. Collections Section Reveal
    gsap.from('#collections .section-header', {
        scrollTrigger: {
            trigger: '#collections',
            start: 'top 80%'
        },
        opacity: 0,
        y: 40,
        duration: 1.0,
        ease: 'power3.out'
    });

    gsap.from('.collection-card-3d', {
        scrollTrigger: {
            trigger: '.collections-grid',
            start: 'top 75%'
        },
        opacity: 0,
        y: 60,
        duration: 1.0,
        stagger: 0.2,
        ease: 'power4.out'
    });

    // 4. Customizer Reveal
    gsap.from('.customizer-preview', {
        scrollTrigger: {
            trigger: '#customizer',
            start: 'top 70%'
        },
        opacity: 0,
        x: -50,
        duration: 1.0,
        ease: 'power3.out'
    });

    gsap.from('.customizer-panel', {
        scrollTrigger: {
            trigger: '#customizer',
            start: 'top 70%'
        },
        opacity: 0,
        x: 50,
        duration: 1.0,
        ease: 'power3.out'
    });

    // 5. Contact / Booking Reveal
    gsap.from('#contact .section-header, .contact-form-container', {
        scrollTrigger: {
            trigger: '#contact',
            start: 'top 75%'
        },
        opacity: 0,
        y: 50,
        duration: 1.0,
        stagger: 0.25,
        ease: 'power3.out'
    });
}

/* ==========================================================================
   Contact Form Formatter & WhatsApp Redirect
   ========================================================================== */
function initContactForm() {
    const form = document.getElementById('order-inquiry-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('user-name').value;
        const city = document.getElementById('user-city').value;
        const fabricSelect = document.getElementById('fabric-interest');
        const fabricText = fabricSelect.options[fabricSelect.selectedIndex].text;
        const notes = document.getElementById('custom-request').value;

        // Build elegant prefilled WhatsApp text block
        let text = `Hi Urwa Styles team!\n\n`;
        text += `I would like to initiate an order inquiry:\n\n`;
        text += `• *Name:* ${name}\n`;
        text += `• *City:* ${city}\n`;
        text += `• *Fabric Interest:* ${fabricText}\n`;
        if (notes.trim() !== '') {
            text += `• *Additional Notes/Stitching:* ${notes}\n`;
        }
        text += `\nPlease let me know availability and pricing. Thanks!`;

        // Direct WhatsApp URL
        const waUrl = `https://wa.me/923001234567?text=${encodeURIComponent(text)}`;
        
        window.open(waUrl, '_blank');
    });
}
