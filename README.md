[![Logo](https://mortonkuo.solutions/github_images/logo.png)](https://mortonkuo.solutions/)

#### [Law Msger](https://mortonkuo.solutions) is an internal communication software that integrates regulation search features into the chat rooms.

#### By incorporating the feature, Law Msger frees lawyers from trivial operations - copying regulations from web pages and pasting them into chat rooms - thereby facilitating workflows in law firms.

:link: https://mortonkuo.solutions/

[![Mac OS](https://img.shields.io/badge/mac%20os-000000?style=for-the-badge&logo=apple&logoColor=white)](https://github.com/morkuo/LawMsger_desktop/releases/download/1.0.0/Law.Msger_mac.zip)
[![Windows](https://img.shields.io/badge/Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/morkuo/LawMsger_desktop/releases/download/1.0.0/Law.Msger_win.zip)

## Table of Content

- [Features](https://github.com/morkuo/LawMsger#features)
- [Try out](https://github.com/morkuo/LawMsger#try-out)
- [How to use Regulation Search](https://github.com/morkuo/LawMsger#how-to-use-regulation-search)
- [Tech Stack](https://github.com/morkuo/LawMsger#tech-stack)
- [Architecture](https://github.com/morkuo/LawMsger#architecture)
- [Appendix](https://github.com/morkuo/LawMsger#appendix)

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

**Firm 2: davidandduke**

Admin

```
  Firm: davidandduke
  Email: david@dd.com
  password: 1234
```

Normal User

```
  Firm: davidandduke
  Email: duke@dd.com
  password: 1234
```

## How to use Regulation Search

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

- Tab through Search Results

  The search results will appear on top of the input field. When the search results appear, press `Tab` to navigate between them.

  ![search_result](https://mortonkuo.solutions/github_images/regulation_search.png)

- Press `Enter` to select the regulation

  ![search_result](https://mortonkuo.solutions/github_images/regulation_search_2.png)

## Tech Stack

**Client:** Vanilla JS, Electron

**Server:** Node.js, Express, Socket.IO

**Database:** Elasticsearch, MySQL, Redis

**Cloud Service (AWS):** EC2, RDS, S3, CloudFront, ELB, Auto Scaling

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

## Appendix

For the Front-End repositories, please refer to:

- [Web](https://github.com/morkuo/LawMsger_frontend)
- [Desktop](https://github.com/morkuo/LawMsger_desktop)
