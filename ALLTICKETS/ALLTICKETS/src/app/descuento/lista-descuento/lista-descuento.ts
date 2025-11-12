import { Component, computed, inject } from '@angular/core';
import { ClienteDescuento } from '../cliente-descuento';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-lista-descuento',
  imports: [DatePipe, RouterLink],
  templateUrl: './lista-descuento.html',
  styleUrl: './lista-descuento.css',
})
export class ListaDescuento {
  private readonly client = inject(ClienteDescuento);
  protected readonly descuentos = toSignal(this.client.obtenerDescuentos()) ;
  protected readonly isLoading = computed(() => this.descuentos() === undefined);
  protected readonly router = inject(Router);

  navegarDetalles(id: string|number){
    this.router.navigateByUrl(`ficha-descuento/${id}`);
  }

}
