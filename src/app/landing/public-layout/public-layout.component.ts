import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-public-layout',
    templateUrl: './public-layout.component.html',
    standalone: false
})
export class PublicLayoutComponent implements OnInit {
    year      = new Date().getFullYear();
    menuOpen  = false;

    get isLoggedIn(): boolean {
        try { return !!localStorage.getItem('currentUser'); } catch { return false; }
    }
    get currentUser(): any {
        try { const r = localStorage.getItem('currentUser'); return r ? JSON.parse(r) : null; } catch { return null; }
    }

    constructor(private router: Router) {}
    ngOnInit(): void {}

    logout(): void {
        localStorage.removeItem('currentUser');
        this.router.navigate(['/landing']);
    }

    windowScroll(): void {
        const el = document.getElementById('pub-navbar');
        if (!el) return;
        if (document.documentElement.scrollTop > 50) el.classList.add('is-sticky');
        else el.classList.remove('is-sticky');
    }
}
