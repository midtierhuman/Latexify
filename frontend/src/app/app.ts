import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  constructor(private cdr: ChangeDetectorRef, private router: Router) {}
  protected readonly title = signal('Latexify');
  value: string = 'value';
  routeTo(url: string) {
    this.router.navigate([url]);
  }
}
