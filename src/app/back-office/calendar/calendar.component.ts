// calendar.component.ts
import { CommonModule, registerLocaleData } from '@angular/common';
import { Component, LOCALE_ID, OnInit } from '@angular/core';
import { addDays, format, startOfMonth, endOfMonth, isSameMonth, isSameDay, parseISO, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserService } from '../../_services/user.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { NgbModal, NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import localeFr from '@angular/common/locales/fr';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.prod';
import { ProfilEnum } from '../../enums/ProfilEnum';
import { CurrencyXofPipe } from '../../core/pipes/currency-xof.pipe';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    NgbTypeaheadModule,
    CurrencyXofPipe
  ],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
  providers: [
    { provide: LOCALE_ID, useValue: 'fr-FR' }
  ]
})
export class CalendarComponent implements OnInit {
  currentDate: Date = new Date();
  meetings: any[] = [];
  selectedMeeting: any = null;
  days: Date[] = [];
  currentMonth: Date = new Date();
  weekDays: string[] = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  bienList: any[] = [];
  durations: number[] = [30, 45, 60, 90, 120];
  
  currentUser: any;
  singleBien: any;
  selectedDate: string = '';
  selectedDuration: number = 60;
  
  // Pagination pour les biens
  bienPage: number = 0;
  bienPageSize: number = 20;
  bienTotalPages: number = 0;
  bienHasMore: boolean = true;
  
  // Meeting form
  meetingTime: string = '09:00';
  meetingTitle: string = '';
  meetingAddress: string = '';
  
  // Search
  searchQuery: string = '';
  
  IMG_URL: string = environment.fileUrl;
  placeholderImage: string = 'assets/images/placeholder.jpg';
  
  constructor(
    private userService: UserService,
    private spinner: NgxSpinnerService,
    private modalService: NgbModal
  ) {
    registerLocaleData(localeFr);
    this.generateCalendar();
  }

  ngOnInit(): void {
    this.getCurrentUser();
  }

  // Fonction de recherche pour le typeahead
  search = (text$: Observable<string>) => {
    return text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          return of([]);
        }
        return this.searchProperties(term);
      }),
      map((response: any) => response.content || [])
    );
  }

  searchProperties(term: string): Observable<any> {
    if (!this.currentUser || this.currentUser.profil !== ProfilEnum.NOTAIRE) {
      return of({ content: [] });
    }
    
    const endpoint = `/realestate/notary/${this.currentUser.id}?page=0&size=${this.bienPageSize}&status=AVAILABLE&search=${encodeURIComponent(term)}`;
    return this.userService.getDatas(endpoint);
  }

  loadMoreProperties(): void {
    if (!this.bienHasMore || !this.currentUser || !this.searchQuery) return;

    this.bienPage++;
    const endpoint = `/realestate/notary/${this.currentUser.id}?page=${this.bienPage}&size=${this.bienPageSize}&status=AVAILABLE&search=${encodeURIComponent(this.searchQuery)}`;
    
    this.userService.getDatas(endpoint).subscribe({
      next: (data: any) => {
        this.bienList = [...this.bienList, ...data.content];
        this.bienHasMore = !data.last;
      },
      error: (err) => console.error('Erreur chargement biens', err)
    });
  }

  getCurrentUser(): void {
    const endpoint = "/v1/user/me";
    this.userService.getDatas(endpoint).subscribe({
      next: (data: any) => {
        this.currentUser = data;
        this.loadMeetings();
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l\'utilisateur', err);
      }
    });
  }

  loadMeetings(): void {
    if (!this.currentUser) return;
    
    const endpoint = this.currentUser.profil === ProfilEnum.NOTAIRE ?
      `/meets/creator/${this.currentUser.id}?page=0&size=50&month=${this.currentMonth.getMonth() + 1}&year=${this.currentMonth.getFullYear()}`
      : `/meets/participant/${this.currentUser.id}?page=0&size=50&month=${this.currentMonth.getMonth() + 1}&year=${this.currentMonth.getFullYear()}`;

    this.spinner.show();

    this.userService.getDatas(endpoint).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        this.meetings = data.content.map((meet: any) => {
          if (!Array.isArray(meet.dateTime) || meet.dateTime.length < 5) {
            return null;
          }

          const [year, month, day, hour, minute] = meet.dateTime;
          const date = new Date(year, month - 1, day, hour, minute);
          
          return {
            ...meet,
            date: format(date, 'yyyy-MM-dd'),
            time: format(date, 'HH:mm'),
            fullDate: date
          };
        }).filter((meeting: any) => meeting !== null);
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Erreur lors de la récupération des réunions', err);
      }
    });
  }

  generateCalendar(): void {
    const start = startOfMonth(this.currentMonth);
    const end = endOfMonth(this.currentMonth);
    this.days = [];

    const firstDayOfMonth = start.getDay();
    const daysFromPrevMonth = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    for (let i = daysFromPrevMonth; i > 0; i--) {
      this.days.push(addDays(start, -i));
    }

    for (let day = start; day <= end; day = addDays(day, 1)) {
      this.days.push(day);
    }

    const lastDayOfMonth = end.getDay();
    const daysFromNextMonth = lastDayOfMonth === 0 ? 0 : 7 - lastDayOfMonth;
    
    for (let i = 1; i <= daysFromNextMonth; i++) {
      this.days.push(addDays(end, i));
    }
  }

  changeMonth(direction: number): void {
    this.currentMonth = addDays(this.currentMonth, direction * 30);
    this.generateCalendar();
    this.loadMeetings();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    this.generateCalendar();
    this.loadMeetings();
  }

  getMeetingsForDay(day: Date): any[] {
    return this.meetings.filter(meeting => 
      isSameDay(parseISO(meeting.date), day)
    ).slice(0, 3);
  }

  getMeetingStatusClass(meeting: any): string {
    const meetingDate = parseISO(meeting.date);
    const today = startOfDay(new Date());

    if (isBefore(meetingDate, today)) {
      return 'past-meeting';
    } else if (isSameDay(meetingDate, today)) {
      return 'current-meeting';
    } else {
      return 'future-meeting';
    }
  }

  isToday(day: Date): boolean {
    return isSameDay(day, new Date());
  }

  isPastDay(day: Date): boolean {
    return isBefore(day, startOfDay(new Date()));
  }

  isCurrentMonth(day: Date): boolean {
    return isSameMonth(day, this.currentMonth);
  }

  getDayName(day: Date): string {
    return format(day, 'EEE', { locale: fr });
  }

  getProfilLabel(profil: string): string {
    const labels: { [key: string]: string } = {
      [ProfilEnum.NOTAIRE]: 'Notaire',
      [ProfilEnum.SYNDIC]: 'Syndic',
      [ProfilEnum.RESERVATAIRE]: 'Réservataire',
      [ProfilEnum.PROMOTEUR]: 'Promoteur'
    };
    return labels[profil] || profil;
  }

  getInitials(nom: string, prenom?: string): string {
    if (!nom) return '?';
    if (prenom) {
      return (prenom[0] + nom[0]).toUpperCase();
    }
    return nom.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getParticipantName(participant: any): string {
    if (!participant) return '';
    return `${participant.prenom || ''} ${participant.nom || ''}`.trim();
  }

  getParticipantRole(participant: any): string {
    if (!participant) return '';
    return this.getProfilLabel(participant.profil);
  }

  isMeetingFormValid(): boolean {
    return !!this.meetingTitle && !!this.meetingTime && !!this.selectedDate && !!this.singleBien;
  }

  openAddMeetingModal(content: any, day: Date): void {
    this.selectedDate = format(day, 'yyyy-MM-dd');
    this.meetingTime = '09:00';
    
    const modalRef = this.modalService.open(content, { 
      ariaLabelledBy: 'modal-basic-title',
      size: 'lg',
      backdrop: 'static'
    });
    
    modalRef.result.then((result) => {
      if (result) {
        this.addNewMeeting();
      }
    }).catch(() => {
      this.resetForm();
    });
  }

  addNewMeeting(): void {
    const meetingDateTime = `${this.selectedDate}T${this.meetingTime}:00`;

    this.spinner.show();
    const endpoint = "/meets";

    const participants = this.singleBien?.clients?.map((client: any) => ({
      id: client.id
    })) || [];

    const newMeeting = {
      dateTime: meetingDateTime,
      duration: this.selectedDuration,
      title: this.meetingTitle,
      address: this.meetingAddress,
      participants: participants,
      propertyId: this.singleBien.id,
      userId: this.currentUser.id
    };

    this.userService.saveAnyData(newMeeting, endpoint).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        
        const [year, month, day, hour, minute] = data.dateTime;
        const date = new Date(year, month - 1, day, hour, minute);
        
        this.meetings.push({
          ...data,
          date: format(date, 'yyyy-MM-dd'),
          time: format(date, 'HH:mm'),
          fullDate: date
        });
        
        this.resetForm();
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Erreur lors de la création de la réunion', err);
      }
    });
  }

  resetForm(): void {
    this.meetingTitle = '';
    this.meetingAddress = '';
    this.meetingTime = '09:00';
    this.selectedDuration = 60;
    this.singleBien = null;
    this.searchQuery = '';
  }

  viewMeetingDetails(meeting: any, modal: any): void {
    // Charger les détails complets de la réunion
    const endpoint = `/meets/${meeting.id}`;
    
    this.spinner.show();
    this.userService.getDatas(endpoint).subscribe({
      next: (data: any) => {
        this.spinner.hide();
        this.selectedMeeting = data;
        
        // Formater la date
        if (Array.isArray(data.dateTime) && data.dateTime.length >= 5) {
          const [year, month, day, hour, minute] = data.dateTime;
          this.selectedMeeting.formattedDate = format(new Date(year, month - 1, day, hour, minute), 'dd MMMM yyyy', { locale: fr });
          this.selectedMeeting.formattedTime = format(new Date(year, month - 1, day, hour, minute), 'HH:mm');
        }
        
        this.modalService.open(modal, {
          size: 'lg',
          centered: true,
          backdrop: 'static'
        });
      },
      error: (err) => {
        this.spinner.hide();
        console.error('Erreur lors du chargement des détails', err);
      }
    });
  }

  formatDateTime(dateArray: number[]): string {
    if (!dateArray || dateArray.length < 5) return '';
    const [year, month, day, hour, minute] = dateArray;
    return format(new Date(year, month - 1, day, hour, minute), 'dd/MM/yyyy HH:mm');
  }

  formatter = (x: any) => x?.name || '';

  onSelect(selectedBien: any): void {
    this.singleBien = selectedBien;
    this.searchQuery = selectedBien.name;
  }

  getFullImageUrl(img: string): string {
    return img ? `${this.IMG_URL}/${encodeURIComponent(img)}` : this.placeholderImage;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (imgElement) {
      imgElement.src = this.placeholderImage;
    }
  }

  onScroll(event: any): void {
    const element = event.target;
    if (element.scrollHeight - element.scrollTop < element.clientHeight + 100) {
      if (this.bienHasMore) {
        this.loadMoreProperties();
      }
    }
  }
}