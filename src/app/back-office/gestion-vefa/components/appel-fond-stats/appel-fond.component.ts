import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UserService } from '../../../../_services/user.service';

@Component({
  standalone: true,
  selector: 'app-payment-call-stats',
  templateUrl: './dashboard.component.html',
  imports: [CommonModule],
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardCallComponent implements OnInit {
  @Input() callState: any;
  paidPercentage: any = 0;

  constructor(private userService: UserService) {

  }

  ngOnInit() {
    // Assurer que les données existent
    if (!this.callState) {
      this.callState = {
        totalAmount: 100000000,
        paidAmount: 200000,
        remainingAmount: 300000,
        remainingPercentage: 20,
      };
    }

    this.getPaidPercentage();
  }

  formatAmount(amount: number): string {
    if (!amount && amount !== 0) return '0';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  getPaidPercentage(): number {
    if (!this.callState?.totalAmount) return 0;

    return 100 - this.callState.remainingPercentage;
  }

  getCircularProgressStyle(): string {
    const percentage = this.getPaidPercentage();
    return `conic-gradient(#10b981 ${percentage * 3.6}deg, #f3f4f6 ${percentage * 3.6}deg)`;
  }
}
