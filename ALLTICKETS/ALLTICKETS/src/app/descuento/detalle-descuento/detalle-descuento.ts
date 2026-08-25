import { Component, inject, linkedSignal, signal } from '@angular/core';
import { ClienteDescuento } from '../../servicios/cliente-descuento';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ModalConfirmacionService } from '../../servicios/modal-confirmacion.service';
import { Descuento } from '../../modelos/descuento';
import { DatePipe } from '@angular/common';
import { FormularioDescuento } from "../formulario-descuento/formulario-descuento";

@Component({
  selector: 'app-detalle-descuento',
  imports: [DatePipe, FormularioDescuento, RouterLink],
  templateUrl: './detalle-descuento.html',
  styleUrl: './detalle-descuento.css',
})
export class DetalleDescuento {

  private readonly client = inject(ClienteDescuento);
  private readonly router = inject(Router);
  protected readonly modalService = inject(ModalConfirmacionService);
  private readonly route = inject(ActivatedRoute);
  private readonly id = this.route.snapshot.paramMap.get('id');

  protected readonly descuentoFuente = toSignal(this.client.obtenerDescuentosId(this.id!));
  protected readonly descuento = linkedSignal(() => this.descuentoFuente());
  protected readonly isEditing = signal(false);

  toggleEdit(){
    this.isEditing.set(!this.isEditing());
    setTimeout(() => {
    document.getElementById("form-edicion")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 50);
  }

  handleEdit(descuento: Descuento){
    this.descuento.set(descuento);
    this.toggleEdit();

  }

  async eliminarDescuento(){
    const confirmar = await this.modalService.confirm('¿Desea borrar el Descuento?');
    if (!confirmar) return;
    
    this.client.eliminarDescuento(this.id!).subscribe({
      next: () => this.router.navigateByUrl('/lista-descuento'),
      error: () => this.modalService.notify('No se pudo eliminar el descuento. Intenta nuevamente en unos minutos.')
    });
  }

}


