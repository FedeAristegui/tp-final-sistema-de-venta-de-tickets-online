import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cabecera } from './cabecera/cabecera';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, Cabecera],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App {
  protected readonly title = signal('ALLTICKETS');
}
