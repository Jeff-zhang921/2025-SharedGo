# 2025-SharedGo
<a href="https://www.postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-316195?style=for-the-badge&logo=postgresql&logoColor=white"/></a>
## Contents
* [Project Description](#project-Description)
* [Stakeholders](#stakeholders)
* [User Stories](#user-stories)
* [Tech Stack](#teckstack)
* [Flow Steps](#flow-steps)
* [Team members](#team-members)
* 

## Project Description

## Stakeholders
* #### Event organizers
   - Description

      They are able to create new activities, oversee attendees, advertise within societies, send invitations and share ongoing updates.

* #### Individual users
    - Description

      The target users of this application are individuals who value social interaction and experience. They need an integrated platform that combines functions for activity discovery, participation, initiation and management. Users can quickly find events based on their geographical location or personalized recommendations, easily complete registration
      and reply, and communicate effectively with event organizers anytime and anywhere, thereby enriching their social life and event experience.
  
* #### Family and Friends Group
   - Description

     These groups focus on collective participation. They value features that help them stay connected during events, and ensure that everyone can easily join in
      
* #### Societies
   - Description

     Societies want to be able to display and advertise their events to the users. They want to easily be able to add their events to the interactive map, ensuring all users gain exposure to their events and can easily sign up.

 * #### The Client
    - Description

      As our point of contact, the client ensures that the projects expands in the intended direction, as per the application's purpose and envisioned end-goal. This includes regular meetings, checking not only progress, but also understanding. This means that the result can be successfully reached, with everyone involved, learning and comprehending along the way.


## User Stories
* As an even host, I want to make it easy to set up, manage and advertise events so that others can join.

* As the client, I want all (direct & indirect) users to have a way of setting-up informal meet-ups. The goal is "to build the most loved real-time activity map". I would like the app to positively impact direct use-cases, for groups, societies, event organisers, and the list goes on!

* As a society, I want to be able to advertise all my events quickly and conveniently. I would like my society and its socials to be displayed to all users via the application and I want users to be able to join my society easily.

## TechStack
| Tech Stack                                                                                                                                           | Description |File to Project| Experience in Team| Maintenance|Risks
|------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|----------------|-------------------|-------------|----|
| PWA<br><br>Frontend<br><br> •React<br>•Typescript<br>•Geocoding <br><br>Backend <br>•Node.js+Express<br>•SuperTest<br><br>Database<br><br>•Postgresql|PWA is a web application that behaves like a native mobile app — installable, offline-capable, fast, and responsive. <br><br> Frontend: React + TypeScript: Core UI, components, caching logic, manifest.json, service worker<br><br>Map: Geocoding Converts addresses ↔ coordinates, displays map markers<br><br>Backend: Node.js + Express: providing a RESTful API that handles requests from the PWA frontend. It manages operations such as retrieving user data, creating new events, and handling geolocation queries.  Express middleware is used for request validation, error handling, and JSON parsing to ensure reliable communication between the client and the server.<br><br>Database: PostgreSQL as the main relational database for storing structured data such as user accounts, activity posts, and location information. PostgreSQL is chosen for its reliability, ACID compliance, and strong support for geospatial queries (via the PostGIS extension), which is essential for map-based features.



## Flow Steps
* #### Indivisual user
     1. Register and log in
     2. Grant location access to see nearby events
     3. Browse events by filter (interest and time)
     4. Tap an event pin to see details
     5. Click "join"
     6. Recieve confirmation
     7. Added to the schedule and access group chat
     
        
* #### Host
     1. Log in with verified host account
     2. Click "create event"
     3. Fill in event details (title, time, location, capacity)
     4. Click "publish"
     5. Event appers on the map, chat is created

* #### Friend group & Societies
     1. CLick "create private event"
     2. Fills in event details (title, time, location, capacity)
     3. Chooses friends from contacts/app list to invite
     4. Click "create & send invites"
     5. Event is created but only visible to invited users
     6. Invited users receive notification
     7. Accepted users added to group chat
        
## Team Members
| Name | Student id | University Email      
|  -------------- |-----------------------|-----------------------|
|  Jingxiang Zhang  | 2606056 | ub24928@bristol.ac.uk |
|  Soko Sengesamba  | 2509140 | az23290@bristol.ac.uk |
|  Minzhe Hu        | 2594564 | qp24108@bristol.ac.uk |
| Thibault Crosnier | 2519193 | pv24925@bristol.ac.uk |
|  Oliver Clease    | 2588166 | ph24475@bristol.ac.uk |
