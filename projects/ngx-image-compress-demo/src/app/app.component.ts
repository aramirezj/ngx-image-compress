import {Component} from '@angular/core';
import {DataUrl, DOC_ORIENTATION, NgxImageCompressService, UploadResponse} from 'ngx-image-compress';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent {
    imgResultBeforeCompress: DataUrl = '';
    imgResultAfterCompress: DataUrl = '';
    imgResultAfterResize: DataUrl = '';
    imgResultUpload: DataUrl = '';
    imgResultAfterResizeMax: DataUrl = '';
    imgResultAfterResizeMaxWithLoading: DataUrl = '';
    imgResultMultiple: UploadResponse[] = [];
    loadingCompression = false;

    constructor(private imageCompress: NgxImageCompressService) {}

    compressFile() {
        return this.imageCompress.uploadFile().then(({image, orientation}: UploadResponse) => {
            this.imgResultBeforeCompress = image;
            console.warn('Size in bytes was:', this.imageCompress.byteCount(image));

            this.imageCompress.compressFile(image, orientation, 50, 50).then((result: DataUrl) => {
                this.imgResultAfterCompress = result;
                console.warn('Size in bytes is now:', this.imageCompress.byteCount(result));
            });
        });
    }

    uploadFile() {
        this.imageCompress
            .uploadFileOrReject()
            .then(({image, orientation, fileName}) => {
                this.imgResultUpload = image;
                console.warn('File Name:', fileName);
                console.warn('Image Orientation', DOC_ORIENTATION[orientation]);
                console.warn(`Image encoded in ${image?.substring(0, 50)}... (${image?.length} characters)`);
            })
            .catch(error => {
                console.log('UploadRejection: ', error);
            });
    }

    uploadMultipleFiles() {
        return this.imageCompress.uploadMultipleFiles().then((multipleOrientedFiles: UploadResponse[]) => {
            this.imgResultMultiple = multipleOrientedFiles;
            console.warn(`${multipleOrientedFiles.length} files selected`);
        });
    }

    uploadAndResize() {
        return this.imageCompress.uploadFile().then(({image, orientation}: UploadResponse) => {
            console.warn('Size in bytes was:', this.imageCompress.byteCount(image));
            console.warn('Compressing and resizing to width 200px height 100px...');

            this.imageCompress.compressFile(image, orientation, 50, 50, 200, 100).then((result: DataUrl) => {
                this.imgResultAfterResize = result;
                console.warn('Size in bytes is now:', this.imageCompress.byteCount(result));
            });
        });
    }

    uploadAndReturnWithMaxSize() {
        return this.imageCompress.uploadAndGetImageWithMaxSize(1, true).then(
            (result: DataUrl) => {
                this.imgResultAfterResizeMax = result;
            },
            (result: string) => {
                console.error(
                    "The compression algorithm didn't succeed! The best size we can do is",
                    this.imageCompress.byteCount(result),
                    'bytes'
                );
                this.imgResultAfterResizeMax = result;
            }
        );
    }

    uploadAndReturnWithMaxSizeWithLoading() {
        this.loadingCompression = true;
        return this.imageCompress
            .uploadAndGetImageWithMaxSize(1, true, true)
            .then(
                (result: DataUrl) => {
                    this.imgResultAfterResizeMaxWithLoading = result;
                },
                (result: any) => {
                    if (result instanceof Error) {
                        if ((result as Error).message.includes('no file selected')) {
                            console.log('No file selected');
                        } else {
                            console.error('Unknown error:', result);
                        }
                    } else {
                        let strResult = result as string;
                        console.error(
                            "The compression algorithm didn't succeed! The best size we can do is",
                            this.imageCompress.byteCount(strResult),
                            'bytes'
                        );
                        this.imgResultAfterResizeMaxWithLoading = strResult;
                    }
                }
            )
            .finally(() => {
                this.loadingCompression = false;
            });
    }

    videoOpened = false;
    videoStream: MediaStream | null = null;
    imageCapture = '';

    toggleVideoCapture() {
        this.videoOpened = !this.videoOpened;
        if (!this.videoOpened) {
            return;
        }

        this.imageCapture = '';

        const constraints = {
            audio: false,
            video: {
                width: {ideal: 1920},
                height: {ideal: 1080},
                facingMode: {ideal: 'user'},
            },
        };

        navigator.mediaDevices
            .getUserMedia(constraints)
            .then(stream => {
                this.videoStream = stream;
                setTimeout(() => {
                    const videoElement: HTMLVideoElement | null = document.querySelector('video');
                    if (videoElement) {
                        videoElement.srcObject = stream;
                    }
                }, 500);
            })
            .catch(err => {
                console.error(err);
                alert('Could not access the camera.');
            });
    }

    acquireImage(): void {
        const video: HTMLVideoElement | null = document.querySelector('video');
        const canvas = document.createElement('canvas');
        if (video) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
        }
        this.imageCapture = canvas.toDataURL('jpg', 95);
        if (this.videoStream) {
            this.videoStream.getVideoTracks().forEach(track => track.stop());
        }
    }

    compressImageCapture() {
        console.warn('Size in bytes was:', this.imageCompress.byteCount(this.imageCapture));

        this.imageCompress.compressFile(this.imageCapture, 1, 50, 50).then((result: DataUrl) => {
            this.imageCapture = result;
            console.warn('Size in bytes is now:', this.imageCompress.byteCount(result));
        });
    }
}
