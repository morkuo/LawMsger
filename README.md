[![Logo](https://mortonkuo.solutions/github_images/logo.png)](https://mortonkuo.solutions/)

#### [Law Msger](https://mortonkuo.solutions) is an internal communication software that integrates regulation search features into the chat rooms.

#### By incorporating the feature, Law Msger frees lawyers from trivial operations - copying regulations from web pages and pasting them into chat rooms - thereby facilitating workflows in law firms.

<br>

[![Browser](https://img.shields.io/badge/Browser-FF7139?style=for-the-badge&logo=GoogleChrome&logoColor=white)](https://mortonkuo.solutions)
[![Mac OS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/morkuo/LawMsger_desktop/releases/download/1.0.0/Law.Msger_mac.zip)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/morkuo/LawMsger_desktop/releases/download/1.0.0/Law.Msger_win.zip)


## Table of Contents

- [Features](https://github.com/morkuo/LawMsger#features)
- [Try out](https://github.com/morkuo/LawMsger#try-out)
- [How to use Regulation Search](https://github.com/morkuo/LawMsger#how-to-use-regulation-search)
- [Tech Stack](https://github.com/morkuo/LawMsger#tech-stack)
- [Architecture](https://github.com/morkuo/LawMsger#architecture)
- [Front-End Repos](https://github.com/morkuo/LawMsger#front-end-repos)
- [Contacts](https://github.com/morkuo/LawMsger#contacts)

## Features

- Group chats
- Regulation Search
- Independent Search Database for each Firm
- Firm Logo Customization
- Profile Picture Customization

## Try out

Use the following testing accounts to try out [Law Msger](https://mortonkuo.solutions):

**Firm 1: kuoandhsu**

Admin

```
  Firm: kuoandhsu
  Email: morton@kh.com
  password: 1234
```

Normal User

```
  Firm: kuoandhsu
  Email: saul@kh.com
  password: 1234
```

**Firm 2:**

For the sake of cost, if you would like to conduct testing on Firm 2 database, please reach out to me via the Contact information [below](https://github.com/morkuo/LawMsger#contact). 

## How to use Regulation Search

![search_typing](https://mortonkuo.solutions/github_images/regulation_search_typing.gif)

Currently, three types of search modes are supported in the chat rooms.
To use each search mode, enter the corresponding symbol into the input field.
The examples are as follows:

- Search by Name and Article

  Enter `＠` symbol, then the name and the article of the regulation.

        ＠著作權法60

- Search by Content

  Enter `｜` symbol, then the content of the regulation.

        ｜電腦程式著作

- Suggestions for Legal Terms

  Enter `＃` symbol, then the keyword.

        ＃著作
        
- Tab through Search Results, then select the regulation

  The search results will appear on top of the input field. When the search results appear, press `Tab` to navigate between them.
  
  Press `Enter` or `left click` on the search result to select.

  ![search_result](https://mortonkuo.solutions/github_images/regulation_search_tab.gif)

## Tech Stack

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)

![ElasticSearch](https://img.shields.io/badge/-ElasticSearch-005571?style=for-the-badge&logo=elasticsearch)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?&style=for-the-badge&logo=redis&logoColor=white)

![AWS](https://img.shields.io/badge/Amazon_AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![EC2](https://img.shields.io/badge/EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)
![RDS](https://img.shields.io/badge/RDS-527FFF?style=for-the-badge&logo=amazonrds&logoColor=white)
![S3](https://img.shields.io/badge/S3-C9292C?style=for-the-badge&logo=amazons3&logoColor=white)
![CloudFront](https://img.shields.io/badge/CloudFront-A21CDC?style=for-the-badge&logo=amazonaws&logoColor=white)
![Route_53](https://img.shields.io/badge/Route_53-034a24?style=for-the-badge&logo=amazonaws&logoColor=white)
![ELB](https://img.shields.io/badge/ELB-1D2A6B?style=for-the-badge&logo=amazonaws&logoColor=white)
![Auto_Scailing](https://img.shields.io/badge/Auto_Scaling-D6138F?style=for-the-badge&logo=amazonaws&logoColor=white)

## Architecture

![Architecture](https://mortonkuo.solutions/github_images/Architecture.png)

- **Front-End and Back-End separation**

  Delivered web page (via AWS S3, CloudFront) and desktop app (via Electron) depending on user preferences.

  The application server was deployed on AWS EC2 instance.

- **Multi-Tenant Design**

  The Elasticsearch databases' IP addresses are listed in AWS RDS.

  When the server is started, it will ask AWS RDS for the Elasticsearch IP addresses that corresponds to each client.

  The server will then establish connections for each client after receiving the IPs.

  Upon receiving requests, the server will perform CRUD operations on Elasticsearch that corresponds to the current client.

- **Redis Adapter Cluster**

  Redis cluster are created to exchange messages between multiple Socket.IO servers.

## Front-End Repos

For the Front-End repositories, please refer to:

- [Web](https://github.com/morkuo/LawMsger_frontend)
- [Desktop](https://github.com/morkuo/LawMsger_desktop)

## Contact

If you would like to sign up for the service or provide feedback, please feel free to contact me at:

[![Email](https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:menghsinkuo@gmail.com)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/mortonkuo)
