function saveAttachmentFromGmail() {
  var parentFolderId = "getItFromDriveFolderURL"; // Change to the parent folder ID in Google Drive
  var parentFolder = DriveApp.getFolderById(parentFolderId);

  const threads = GmailApp.search("search-the-gmail-you-want-to-autosave");

  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      message.getAttachments().forEach(attachment => {
      //it will create a folder inside parentFolder with the email received date
      var emailDate = message.getDate();
      var formattedDate = Utilities.formatDate(emailDate, Session.getScriptTimeZone(), "yyyy-MM-dd");
      
      //if the folder already exist it will not create another folder with same name
      var existsFolder = checkFolderExistsInParent(parentFolder, formattedDate);
      if (existsFolder) {
        var dateFolder = parentFolder.getFoldersByName(formattedDate).next();
      } else {
        var dateFolder = parentFolder.createFolder(formattedDate);
      }
        
      //if attachment is a zip it will extract the files inside the zip
      if (attachment.getContentType() === "application/zip") {
          try {
            var attachmentBlob = attachment.getAs("application/zip");
            Logger.log("Unzipping: " + attachmentBlob.getName());
            var unzipFiles = Utilities.unzip(attachmentBlob);

            //unzipping the zip and saving each file of zip in the dateFolder 
            for (var j = 0; j < unzipFiles.length; j++) {
              var unzipFile = unzipFiles[j];
              var existsFile = checkFileExistsInFolder(dateFolder, unzipFile.getName());

              //if the file already exist it will not create the file with same name
              if (existsFile) {
                Logger.log("The file exists within the folder: " + dateFolder);
              } else {
                dateFolder.createFile(unzipFile);
                Logger.log("File Extracted: " + unzipFile.getName());
              }
              
            }
          } catch (error) { //if unable to unzip (password protected zip extraction is difficult here), save the zip file itself
            Logger.log("Error unzipping attachment: " + attachmentBlob.getName() + " : "+ error);
            var existsFile = checkFileExistsInFolder(dateFolder, attachment.getName());

            if (existsFile) {
              Logger.log("The file exists within the folder: " + dateFolder);
            } else {
              dateFolder.createFile(attachment);
              Logger.log("File Extracted: " + attachment.getName());
            }
          }
        } else {
          var existsFile = checkFileExistsInFolder(dateFolder, attachment.getName());

          if (existsFile) {
            Logger.log("The file exists within the folder: " + dateFolder);
          } else {
            dateFolder.createFile(attachment);
            Logger.log("File saved: " + attachment.getName());
          }
        }
      })
    })
  })
}

function checkFolderExistsInParent(parentFolderName, folderName) {
  var parentFolder = DriveApp.getFoldersByName(parentFolderName).next();
  var folders = parentFolder.getFoldersByName(folderName);
  return folders.hasNext();
}

function checkFileExistsInFolder(folderName, fileName) {
  var folder = DriveApp.getFoldersByName(folderName).next();
  var files = folder.getFilesByName(fileName);
  return files.hasNext();
}
