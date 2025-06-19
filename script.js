document.addEventListener('DOMContentLoaded', () => {
    const attendanceForm = document.getElementById('attendanceForm');
    const submitButton = attendanceForm.querySelector('button[type="submit"]');
    const loadingMessage = document.getElementById('loadingMessage');

    attendanceForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // منع إرسال النموذج بالطريقة التقليدية

        // 1. إظهار رسالة التحميل وتعطيل الزر
        loadingMessage.classList.add('visible');
        submitButton.disabled = true;

        // جمع البيانات من النموذج
        const fullName = document.getElementById('fullName').value;
        const jobTitle = document.getElementById('jobTitle').value;
        const assignmentType = document.getElementById('assignmentType').value;
        const department = document.getElementById('department').value;
        const project = document.getElementById('project').value;

        // الحصول على التاريخ والوقت بتوقيت مصر
        const now = new Date();
        const options = {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false // 24-hour format
        };
        const formatter = new Intl.DateTimeFormat('en-CA', options); // Using en-CA for YYYY-MM-DD
        const parts = formatter.formatToParts(now);
        let year = '';
        let month = '';
        let day = '';
        let hour = '';
        let minute = '';
        let second = '';

        for (const part of parts) {
            switch (part.type) {
                case 'year': year = part.value; break;
                case 'month': month = part.value; break;
                case 'day': day = part.value; break;
                case 'hour': hour = part.value; break;
                case 'minute': minute = part.value; break;
                case 'second': second = part.value; break;
            }
        }
        const date = `${year}-${month}-${day}`;
        const time = `${hour}:${minute}:${second}`;

        // الحصول على معلومات الجهاز
        const userAgent = navigator.userAgent;
        let deviceType = 'غير معروف';
        if (/android/i.test(userAgent)) {
            deviceType = 'Android';
        } else if (/ipad|iphone|ipod/i.test(userAgent)) {
            deviceType = 'iOS';
        } else if (/win/i.test(userAgent)) {
            deviceType = 'Windows';
        } else if (/mac/i.test(userAgent)) {
            deviceType = 'macOS';
        } else if (/linux/i.test(userAgent)) {
            deviceType = 'Linux';
        }

        // الحصول على IP الجهاز (يتطلب خدمة خارجية)
        let ipAddress = 'غير متاح';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
            console.log('تم الحصول على IP بنجاح:', ipAddress);
        } catch (error) {
            console.error('خطأ في الحصول على IP الجهاز:', error);
            ipAddress = 'تعذر الحصول على IP';
        }

        // الحصول على الموقع الجغرافي (خط الطول وخط العرض)
        let geolocation = 'غير متاح';
        let geolocationSuccess = false; // flag لتتبع نجاح الحصول على الموقع

        try {
            console.log('طلب الحصول على الموقع الجغرافي...');
            const position = await new Promise((resolve, reject) => {
                if (navigator.geolocation) {
                    // زيادة timeout لزيادة فرصة الحصول على الموقع
                    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
                } else {
                    reject(new Error('Geolocation is not supported by this browser.'));
                }
            });
            geolocation = `${position.coords.latitude},${position.coords.longitude}`;
            geolocationSuccess = true; // تعيين العلم إلى true عند النجاح
            console.log('تم الحصول على الموقع الجغرافي بنجاح:', geolocation);
        } catch (error) {
            console.error('خطأ في الحصول على الموقع الجغرافي:', error);
            // لا تضع alert هنا، سنتحقق من العلم بعد الكتلة
        }

        // 2. التحقق الإلزامي من الحصول على الموقع الجغرافي
        if (!geolocationSuccess) {
            alert('عذراً، يجب السماح للحصول على الموقع الجغرافي للمتابعة.');
            // إخفاء التحميل وتمكين الزر قبل المغادرة
            loadingMessage.classList.remove('visible');
            submitButton.disabled = false;
            return; // إيقاف الإرسال
        }

        // إنشاء معرف فريد للجهاز
        let deviceID = localStorage.getItem('deviceID');
        if (!deviceID) {
            deviceID = 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
            localStorage.setItem('deviceID', deviceID);
            console.log('تم إنشاء DeviceID جديد:', deviceID);
        } else {
            console.log('استخدام DeviceID موجود:', deviceID);
        }

        // بناء كائن البيانات للإرسال
        const data = {
            fullName: fullName,
            jobTitle: jobTitle,
            assignmentType: assignmentType,
            department: department,
            project: project,
            geolocation: geolocation,
            date: date,
            time: time,
            deviceType: deviceType,
            ipAddress: ipAddress,
            deviceID: deviceID
        };

        console.log('بيانات تم جمعها بنجاح وجاهزة للإرسال:', data);

        // رابط Web App الخاص بـ Google Apps Script
        // ******** تأكد من استبدال هذا الرابط برابط Web App الأخير والفعال لديك ********
        const webAppUrl = 'https://script.google.com/macros/s/AKfycbzZ7t-EEdpho_YzsF4YdMRVW24N4ixGzITjJ2ON_gnQdnyrpQKcS8a3scapALvwRxH7lQ/exec'; // *** لا تنس تغيير هذا ***
        console.log('عنوان Web App URL المستخدم للإرسال:', webAppUrl);

        try {
            console.log('بدء إرسال الطلب الى Web App...');
            const response = await fetch(webAppUrl, {
                method: 'POST',
                mode: 'no-cors', // مهم لتجنب مشاكل CORS
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            console.log('تم إرسال الطلب بنجاح من المتصفح (استجابة no-cors).');

            // 3. إظهار رسالة النجاح
            alert('تم تسجيل الحضور بنجاح!');
            attendanceForm.reset(); // إعادة تعيين النموذج بعد التسجيل
            // يمكنك إزالة السطر التالي إذا كنت تريد أن يظل الـ DeviceID موجودًا دائمًا لنفس الجهاز
            // وإلا، سيتغير في كل مرة يتم فيها التسجيل.
            // localStorage.removeItem('deviceID');
        } catch (error) {
            console.error('حدث خطأ أثناء إرسال الطلب من المتصفح:', error);
            alert('حدث خطأ أثناء تسجيل الحضور. يرجى المحاولة مرة أخرى.');
        } finally {
            // دائماً قم بإخفاء رسالة التحميل وتمكين الزر عند الانتهاء (سواء نجح أو فشل)
            loadingMessage.classList.remove('visible');
            submitButton.disabled = false;
        }
    });
});