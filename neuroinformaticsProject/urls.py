from django.contrib import admin
from django.urls import path
from homeroots.views import returnHomePage
from submitdata.views import returnSubmitDataPage
from contactus.views import returnContactUsPage
from aboutcontent.views import returnAboutPage
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path(r'', returnHomePage, name='home'), # Root of application
    path(r'admin/', admin.site.urls, name='admin'),
    path(r'submit_data_page/', returnSubmitDataPage, name='submitdatapage'),
    path(r'contact_us_page/', returnContactUsPage, name='contactuspage'),
    path(r'about_page/', returnAboutPage, name='aboutpage'),
] 

if settings.DEBUG:
    urlpatterns+=static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns+=static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
