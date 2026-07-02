export const flipCoin = (result) => {
    const coin = document.querySelector('.coin');
    const coinContainer = document.querySelector('.coin-container');
    
    // Reset animation
    gsap.set(coin, { rotationY: 0 });

    const tl = gsap.timeline();

    // The Jump
    tl.to(coinContainer, { y: -150, duration: 0.5, ease: "power2.out" })
      .to(coinContainer, { y: 0, duration: 0.5, ease: "bounce.out" });

    // The Spin
    const rotation = result === 'heads' ? 1440 : 1800; // 4 full spins vs 5 spins
    tl.to(coin, { 
        rotationY: rotation, 
        duration: 1, 
        ease: "power2.inOut" 
    }, 0);

    return tl;
};