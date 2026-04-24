import { Component, OnInit } from '@angular/core';
import { TijaraApiService } from 'src/app/core/services/tijara-api.service';

@Component({
  selector: 'app-followers-ent',
  templateUrl: './followers-ent.component.html',
  standalone: false
})
export class FollowersEntComponent implements OnInit {

  breadCrumbItems = [
    { label: 'Vendeur' },
    { label: 'Mes Abonnés', active: true }
  ];

  total     = 0;
  followers: any[] = [];
  loading   = true;
  search    = '';

  constructor(private api: TijaraApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api.getMyFollowers().subscribe({
      next: (res: any) => {
        this.total     = res.total     ?? 0;
        this.followers = res.followers ?? [];
        this.loading   = false;
      },
      error: () => { this.loading = false; }
    });
  }

  get filtered(): any[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.followers;
    return this.followers.filter(f =>
      (f.full_name  || '').toLowerCase().includes(q) ||
      (f.username   || '').toLowerCase().includes(q) ||
      (f.email      || '').toLowerCase().includes(q)
    );
  }

  initials(f: any): string {
    const name = f.full_name || f.username || '?';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
