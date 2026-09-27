/**
 * @file main.js
 * @description Core Engine JavaScript Terpusat untuk aRo Collaborative Engine / MyHomes
 * @author aRo (Senior Software Engineer & Frontend Developer)
 * @version 3.0.0 (Production Ready - Unified Logic for Index, About, & Categories)
 */

'use strict';

    setInterval(function () {
        const startTime = performance.now();
        debugger; // Memicu breakpoint jika inspect dibuka
        const endTime = performance.now();
        
        // Jika jeda waktu lebih lama dari biasanya, berarti Developer Tools sedang aktif/terbuka
        if (endTime - startTime > 100) {
            document.body.innerHTML = "<h1 style='text-align:center; margin-top:20vh;'>Akses Dilarang! Halaman ini diproteksi.</h1>";
        }
    }, 1000);

    // 1. Mencegah Klik Kanan (Context Menu)
    document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
    });

    // 2. Mencegah Shortcut Keyboard untuk Inspect Element & View Source
    document.addEventListener('keydown', function (e) {
        // Tombol F12
        if (e.key === 'F12') {
            e.preventDefault();
            alert('Aksi dilarang!');
        }

        // Kombinasi Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Developer Tools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
            e.preventDefault();
            alert('Aksi dilarang!');
        }

        // Kombinasi Ctrl+U (View Page Source)
        if (e.ctrlKey && e.key === 'U') {
            e.preventDefault();
            alert('Aksi dilarang!');
        }
    });