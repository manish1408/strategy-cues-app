import { Component } from '@angular/core';
import { finalize } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-theme',
  templateUrl: './theme.component.html',
  styleUrl: './theme.component.scss',
})
export class ThemeComponent {
  widgetImage =
    'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
  chatbotImage =
    'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
  companyImage =
    'https://milodocs.blob.core.windows.net/public-docs/profile-picture.webp';
  selectedChatBotId: string = '';
  loading: boolean = false;
  user: any;
  userInput: string = '';
  userTheme: any;
  selectedThemeId = '';
  themes: any[] = [];
  customCSSLstring: string = '';
  widgetType: string = '';
  widgetPosition: string = '';
  removeBranding: boolean = false;
  removeChatbotName: boolean = false;
  conversation: any[] = [];
  activeItem: string = '7'; // Default active item
  circleTitles: any[] = [
    {
      title: 'Bot Background',
      key: 'aiMessageBackgroundColor',
    },
    {
      title: 'User Background',
      key: 'userMessageBackgroundColor',
    },
    {
      title: 'Widget Background',
      key: 'widgetBackgroundColor',
    },
    {
      title: 'Chat Window',
      key: 'chatWindowBackgroundColor',
    },
    {
      title: 'Bot Font Color',
      key: 'botFontColor',
    },
    {
      title: 'User Font Color',
      key: 'userFontColor',
    },
  ];
  imgFiles: any[] = [];
	imageTypes = ['jpeg', 'webp', 'jpg', 'png'];
	maxSize = 10 * 1024 * 1024; // 10 MB

  isModalOpen = false;
  selectedImage: any;
  widgetImages = [
    "assets/widgets/chat-widget-1.png",
    "assets/widgets/chat-widget-2.png",
    "assets/widgets/chat-widget-3.png",
  ];
  constructor(
    private router: Router,
    private toastr: ToastrService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.selectedChatBotId = params['id'];
    });
    this.loading = true;
    this.getUserTheme();
    this.getConversations();
  }

  getUserTheme() {
    this.loading = true;
    // this.themeService
    //   .getuserThemes(this.user?._id, this.selectedChatBotId)
    //   .pipe(finalize(() => (this.loading = false)))
    //   .subscribe({
    //     next: (res) => {
    //       this.userTheme = res.data;
    //       this.setValues(res.data);
    //     },
    //     error: (err) => {
    //       // console.log('error: get user themes ', err);
    //     },
    //   });
  }

  getConversations(){
    this.loading = true;
    // this.conversationService
    //   .getStats(this.selectedChatBotId)
    //   .pipe(finalize(() => (this.loading = false)))
    //   .subscribe((res) => {
    //     // console.log(res.data[0]); 
    //     // this.stats = res.data;
    //     this.conversation=res.data[0].latestMessage.message;
    //     // console.log("here",res.data[0].latestMessage.message)
    //     // this.receiverId=res.data.receiverId;
    //   });
  }

  goto() {
    this.router.navigate(['chatbots']);
  }
  confirmTheme() {
    // this.toastService.showConfirm(
    //   'Are you sure?',
    //   'Replace current theme with selected theme?',
    //   'Yes, replace it!',
    //   'No, cancel',
    //   () => {
    //     // Confirm callback
    //     this.updateTheme();
    //   },
    //   () => {
    //     // Cancel callback
    //   }
    // );
  }

  preventChange(event: Event,label: string) {
    // event.preventDefault();
    // event.stopPropagation();
    this.widgetType=label;
  }

  updateWidgetPosition(event: Event,label: string){
    this.widgetPosition=label;
  }

  onFileSelected(event: any, type: string): void {
		const file: File = event.target.files[0];
		if (file) {
			const fileType = file.type.split('/')[1];
			if (!this.imageTypes.includes(fileType)) {
				this.toastr.error('Unsupported File type.');
				return;
			}

			// Validate file size
			if (file.size > this.maxSize) {
				this.toastr.error('File exceeds the maximum size of 10MB.');
				return;
			}
			const reader = new FileReader();
			reader.onload = (e: any) => {
				if (type === 'widget') {
					this.widgetImage = e.target.result;
				}
				if (type === 'chatbot') {
					this.chatbotImage = e.target.result;
				}
				if (type === 'company') {
					this.companyImage = e.target.result;
				}
			};
			reader.readAsDataURL(file);

			const existingIndex = this.imgFiles.findIndex((img) => img.type === type);

			if (existingIndex !== -1) {
				this.imgFiles[existingIndex] = { type, file };
			} else {
				this.imgFiles.push({ type, file });
			}
		}
	}

  updateTheme() {
		this.loading = true;
		if (this.imgFiles.length > 0) {
			const filesToAdd = this.imgFiles.filter((file) => file);
			let fd = new FormData();
			filesToAdd.forEach((f) => {
				fd.append('files', f.file);
				fd.append('types', f.type);
			});
			fd.append('chatbotId', this.selectedChatBotId);
			// this.chatService
			// 	.saveWidgetImage(fd)
			// 	.pipe(finalize(() => (this.loading = false)))
			// 	.subscribe((res) => {
			// 		this.userTheme.removeBranding = this.removeBranding;
			// 		this.userTheme.removeChatbotName = this.removeChatbotName;
			// 		this.userTheme.widgetPosition = this.widgetPosition;
			// 		const themeDetails = {
			// 			...this.userTheme,
			// 			chatbotImage: res.data.themeDetails.chatbotImage,
			// 			companyImage: res.data.themeDetails.companyImage,
			// 			widgetImage: res.data.themeDetails.widgetImage,
			// 		};
			// 		const reqObj = {
			// 			themes: themeDetails,
			// 			chatbotId: this.selectedChatBotId,
			// 		};

			// 		this.themeService
			// 			.updateUserTheme(reqObj)
			// 			.pipe(finalize(() => (this.loading = false)))
			// 			.subscribe({
			// 				next: (res) => {
			// 					if (res.result) {
			// 						this.toastr.success('Theme updated');
			// 						this.getUserTheme();
			// 					} else {
			// 						this.toastr.error(res.msg);
			// 					}
			// 				},
			// 				error: (err) => {
			// 					// console.log(err);
			// 					this.toastr.error(err.error.msg);
			// 				},
			// 			});
			// 		// console.log('res  image', res);
			// 	});
		} else {
			this.userTheme.removeBranding = this.removeBranding;
			this.userTheme.removeChatbotName = this.removeChatbotName;
			this.userTheme.widgetPosition = this.widgetPosition;
			const reqObj = {
				themes: this.userTheme,
				chatbotId: this.selectedChatBotId,
			};

			// this.themeService
			// 	.updateUserTheme(reqObj)
			// 	.pipe(finalize(() => (this.loading = false)))
			// 	.subscribe({
			// 		next: (res) => {
			// 			if (res.result) {
			// 				this.toastr.success('Theme updated');
			// 				this.getUserTheme();
			// 			} else {
			// 				this.toastr.error(res.msg);
			// 			}
			// 		},
			// 		error: (err) => {
			// 			// console.log(err);
			// 			this.toastr.error(err.error.msg);
			// 		},
			// 	});
		}
	}

  backgroundColor(title: string) {
    switch (title) {
      case 'Bot Background':
        return this.userTheme.aiMessageBackgroundColor;
      case 'User Background':
        return this.userTheme.userMessageBackgroundColor;
      case 'Widget Background':
        return this.userTheme.widgetBackgroundColor;
      case 'Chat Window':
        return this.userTheme.chatWindowBackgroundColor;
      case 'Bot Font Color':
        return this.userTheme.botFontColor;
      case 'User Font Color':
        return this.userTheme.userFontColor;
    }
  }

  setValues(theme: any) {
    this.customCSSLstring = theme.customCss;
		this.selectedThemeId = theme._id;
		this.widgetType = theme.widgetType;
		this.removeBranding = theme.removeBranding;
		this.removeChatbotName = theme.removeChatbotName;
		this.widgetPosition = theme.widgetPosition;
		this.widgetImage = theme.widgetImage;
		this.chatbotImage = theme.chatbotImage;
		this.companyImage = theme.companyImage;
  }

  onColorChange(color: any, key: any) {
    this.userTheme[`${key}`] = color;
  }

  async selectImage(imageUrl: string) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const file = new File([blob], this.getFileName(imageUrl), {
        type: blob.type,
      });

      const fileType = file.type.split("/")[1];
      if (!this.imageTypes.includes(fileType)) {
        this.toastr.error("Unsupported File type.");
        return;
      }

      if (file.size > this.maxSize) {
        this.toastr.error("File exceeds the maximum size of 10MB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.widgetImage = e.target.result; // Update UI with selected image
      };
      reader.readAsDataURL(file);

      const existingIndex = this.imgFiles.findIndex(
        (img) => img.type === "widget"
      );
      const fileData = { type: "widget", file };

      if (existingIndex !== -1) {
        this.imgFiles[existingIndex] = fileData;
      } else {
        this.imgFiles.push(fileData);
      }

      this.selectedImage = imageUrl;
    } catch (error) {
      console.error("Error fetching predefined image:", error);
      this.toastr.error("Failed to select image.");
    }
  }

  closeModal() {
    this.isModalOpen = false;
  }

  openModal() {
    this.isModalOpen = true;
  }
  getFileName(url: string): string {
    return url.substring(url.lastIndexOf("/") + 1);
  }
}
